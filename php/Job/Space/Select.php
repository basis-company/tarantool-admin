<?php

namespace Job\Space;

use Exception;

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

        try {
            $data = $this->getMapper()->getClient()->getSpace($this->space)
                ->select($key, $this->index, $this->limit, $this->offset, $this->iterator)
                ->getData();

            $total = $this->getMapper()->getClient()
                ->evaluate("return box.space.$this->space.index[$this->index]:count(...)", [$key])
                ->getData()[0];

        } catch (Exception $e) {
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
