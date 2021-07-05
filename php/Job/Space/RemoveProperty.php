<?php

namespace Job\Space;

use Exception;

class RemoveProperty extends Job
{
    public string $name;

    public function run(): void
    {
        $space = $this->getSpace();
        if (!$space->hasProperty($this->name)) {
            throw new Exception("Property $this->name does not exist");
        }

        $space->removeProperty($this->name);
    }
}
