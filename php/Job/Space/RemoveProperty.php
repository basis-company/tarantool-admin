<?php

namespace Job\Space;

use Exception;

class RemoveProperty extends Job
{
    public $name;

    public function run()
    {
        $space = $this->getSpace();

        if (!$space->hasProperty($this->name)) {
            throw new Exception("Property $this->name nnot exists");
        }

        $space->removeProperty($this->name);
    }
}
