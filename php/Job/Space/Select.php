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
        $key = [];
        foreach ($this->key as $value) {
            if ($value === null) {
                break;
            }
            $key[] = $value;
        }

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

            $data = $this->getMapper()->getClient()->getSpace($this->space)
                ->select($criteria);

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

            $schema = $this->getMapper()->getSchema();
            $index = $schema->getSpace($this->space)->getIndex($this->index);

            try {
                if (!in_array($this->iterator, [0, 2])) {
                    throw new Exception("No total rows for non-equals iterator type");
                }
                if ($schema->getSpace($this->space)->getEngine() == 'vinyl') {
                    if (getenv('TARANTOOL_ENABLE_VINYL_PAGE_COUNT') !== false) {
                        throw new Exception("No total rows for vinyl spaces");
                    }
                }
                [$total] = $this->getMapper()->getClient()
                    ->call("box.space.$this->space.index.$index->name:count", $key);
            } catch (Exception) {
                $criteria = $criteria->andLimit($this->limit + 1);
                $extra = $this->getMapper()->getClient()->getSpace($this->space)
                    ->select($criteria);
                // next page flag
                $next = count($extra) > count($data);
            }
        } catch (Exception $e) {
            if (!$data) {
                throw $e;
            }
        }

        if (!json_encode($data)) {
            foreach ($data as $i => $tuple) {
                foreach ($tuple as $k => $v) {
                    if (is_string($v) && !json_encode($v)) {
                        $data[$i][$k] = '!!binary ' . base64_encode($v);
                    }
                }
            }
        }

        return compact('data', 'total', 'next');
    }
}
