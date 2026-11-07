<?php

namespace Job\Space;

use Exception;

class Create extends Job
{
    public function run(): void
    {
        $created = false;

        foreach ($this->getMappers() as $mapper) {
            if ($mapper->hasSpace($this->space)) {
                continue;
            }

            $mapper->createSpace($this->space);
            $created = true;
        }

        if (!$created) {
            throw new Exception("Space $this->space already exists");
        }
    }
}
