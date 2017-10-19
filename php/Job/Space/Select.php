<?php

namespace Job\Space;

use Exception;

class Select extends Job
{
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

        return compact('data', 'total');
    }
}
