<?php

namespace Job\Space;

use Exception;

class Create extends Job
{
    public function run(): void
    {
        $schema = $this->getMapper()->getSchema();
        if ($schema->hasSpace($this->space)) {
            throw new Exception("Space $this->space already exists");
        }

        $schema->createSpace($this->space);
    }
}
