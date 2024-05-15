<?php

namespace Job\Space;

use Exception;

class Create extends Job
{
    public function run(): void
    {
        if ($this->getMapper()->hasSpace($this->space)) {
            throw new Exception("Space $this->space already exists");
        }

        $this->getMapper()->createSpace($this->space);
    }
}
