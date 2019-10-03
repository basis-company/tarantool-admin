<?php

namespace Job\Space;

use Exception;
use Tarantool\Client\Schema\Criteria;

class Select extends Job
{
    public $limit = 0;
    public $offset = 0;
    public $index = 0;
    public $key = [];
    public $iterator = 2;

    public function run()
    {
        $key = [];
        foreach ($this->key as $value) {
            if (is_null($value)) {
                break;
            }
            $key[] = $value;
        }

        $data = null;
        $total = 0;

        try {
            $criteria = Criteria::index($this->index)->andLimit($this->limit)->andOffset($this->offset);
            if (count($key)) {
                $criteria = $criteria->andKey($key);
            }
            $iterators = [
                'Eq', 'Req', 'All', 'Lt', 'Le', 'Ge', 'Gt',
                'BitsAllSet', 'BitsAnySet', 'BitsAllNotSet',
                'Overlaps', 'Neighbour',
            ];
            $iteratorMethod = 'and'.$iterators[$this->iterator].'Iterator';
            $criteria = $criteria->$iteratorMethod();

            $data = $this->getMapper()->getClient()->getSpace($this->space)
                ->select($criteria);

            foreach ($data as $x => $tuple) {
                foreach ($tuple as $y => $value) {
                    if (is_numeric($value) && $value > 2^32 -1) {
                        $data[$x][$y] = (string) $value;
                    }
                }
            }

            $indexes = $this->getMapper()->getSchema()->getSpace($this->space)->getIndexes();
            $indexName = $indexes[$this->index]['name'];

            try {
                [$total] = $this->getMapper()->getClient()
                    ->call("box.space.$this->space.index.$indexName:count", $key);
            } catch (Exception $e) {
                // ignore total calculation exception
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
                        $data[$i][$k] = '!!binary '.base64_encode($v);
                    }
                }
            }
        }

        return compact('data', 'total');
    }
}
