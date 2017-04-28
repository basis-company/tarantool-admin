<?php

namespace Jobs\Space;

use Exception;

class Select extends Job
{
    public $index = 0;
    public $key = [];
    public $iterator = 2;

    public function run()
    {
        $data = $this->getMapper()->getClient()->getSpace($this->space)
            ->select($this->key, $this->index, $this->limit, $this->offset, $this->iterator)
            ->getData();

        try {
            $total = $this->getMapper()->getClient()
                ->evaluate("return box.space.$this->space.index[$this->index]:count(...)", [$this->key])
                ->getData()[0];

        } catch(Exception $e) {

        }

        return compact('data', 'total');
    }
}
