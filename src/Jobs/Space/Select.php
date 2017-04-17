<?php

namespace Jobs\Space;

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

        $total = $this->getMapper()->getClient()
            ->evaluate("return box.space.$this->space.index[$this->index]:count(...)", [$this->key])
            ->getData();

        return compact('data', 'total');
    }
}