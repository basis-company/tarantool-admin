<?php

namespace Job\Space;

use Decimal\Decimal;
use Exception;
use Symfony\Component\Uid\Uuid;
use Tarantool\Client\Schema\Criteria;
use Tarantool\Client\Schema\IteratorTypes;

class Select extends Job
{
    public int $limit = 0;
    public int $offset = 0;
    public int $index = 0;
    public array $key = [];
    public int $iterator = IteratorTypes::ALL;

    public function run(): array
    {
        if ($this->isCluster()) {
            return $this->runCluster();
        }

        $key = $this->trimTail($this->key);

        $data = null;
        $total = null;
        $next = false;

        try {
            $criteria = Criteria::index($this->index)
                ->andLimit($this->limit)
                ->andOffset($this->offset)
                ->andIterator($this->iterator);

            if (count($key)) {
                $criteria = $criteria->andKey($key);
            }

            $data = $this->getMapper()->client->getSpace($this->space)
                ->select($criteria);

            $data = $this->normalizeValues($data);

            try {
                [$space] = $this->getMapper()->find(
                    '_vspace',
                    ['name' => $this->space]
                );
                if (!in_array($this->iterator, [0, 2])) {
                    throw new Exception(
                        "No total rows for non-equals iterator type"
                    );
                }
                if ($space['engine'] == 'vinyl') {
                    if (getenv('TARANTOOL_ENABLE_VINYL_PAGE_COUNT') !== false) {
                        throw new Exception("No total rows for vinyl spaces");
                    }
                }

                $index = $this->getMapper()->findOrFail(
                    '_vindex', [
                        'id' => $space['id'],
                        'iid' => $this->index
                    ]
                );

                $indexName = $index['name'];

                [$total] = $this->getMapper()->client->call(
                    "box.space.$this->space.index.$indexName:count",
                    $key
                );
            } catch (Exception) {
                $criteria = $criteria->andLimit($this->limit + 1);
                $extra = $this->getMapper()->client->getSpace($this->space)
                    ->select($criteria);
                // next page flag
                $next = count($extra) > count($data);
            }
        } catch (Exception $e) {
            if (!$data) {
                throw $e;
            }
        }

        $data = $this->fixBinaryValues($data);

        return compact('data', 'total', 'next');
    }

    /**
     * Full scans every host of the list and merges the result set.
     * Space and index are addressed by name, since ids may differ
     * between instances of one cluster.
     */
    protected function runCluster(): array
    {
        $key = $this->trimTail($this->key);

        $indexName = $this->indexName();
        $rows = [];

        $errors = [];
        $ok = false;

        foreach ($this->getMappers() as $dsn => $mapper) {
            $criteria = Criteria::index($indexName ?? $this->index)
                ->andIterator($this->iterator);

            if (count($key)) {
                $criteria = $criteria->andKey($key);
            }

            try {
                $found = $mapper->client->getSpace($this->space)
                    ->select($criteria);

                $ok = true;
            } catch (Exception $e) {
                $errors[] = $dsn . ': ' . $e->getMessage();
                continue;
            }

            $rows = array_merge($rows, $this->normalizeValues($found));
        }

        if (!$ok) {
            throw new Exception(implode('; ', $errors) ?: 'nothing to select from');
        }

        $data = array_slice($rows, $this->offset, $this->limit ?: null);

        $total = count($rows);
        $next = $this->offset + count($data) < $total;

        $data = $this->fixBinaryValues($data);

        return compact('data', 'total', 'next');
    }

    /**
     * Resolves the requested index id to its name using the first host
     * that knows it. Index ids are not stable across cluster nodes.
     */
    protected function indexName(): ?string
    {
        if ($this->index === 0 || !is_int($this->index)) {
            return $this->index === 0 ? 'primary' : null;
        }

        foreach ($this->getMappers() as $mapper) {
            try {
                [$space] = $mapper->find('_vspace', ['name' => $this->space]);

                if (!$space) {
                    continue;
                }

                $indexes = $mapper->find('_vindex', [
                    'id' => $space['id'],
                    'iid' => $this->index,
                ]);

                if (count($indexes)) {
                    return $indexes[0]['name'];
                }
            } catch (Exception) {
                continue;
            }
        }

        return null;
    }

    protected function normalizeValues(array $data): array
    {
        foreach ($data as $x => $tuple) {
            foreach ($tuple as $y => $value) {
                if ($value instanceof Decimal) {
                    $value = $value->toString();
                } elseif ($value instanceof Uuid) {
                    $value = $value->toRfc4122();
                }
                $data[$x][$y] = $value;
            }
        }

        return $data;
    }

    protected function fixBinaryValues($data)
    {
        if ($data && !json_encode($data)) {
            foreach ($data as $i => &$tuple) {
                array_walk_recursive(
                    $tuple, function (&$v) {
                        if (is_string($v) && !json_encode($v)) {
                            $v = '!!binary ' . base64_encode($v);
                        }
                    }
                );
            }
        }

        return $data;
    }
}
