<?php

namespace Job\Space;

use Exception;

class RemoveIndex extends Job
{
    public $name;

    public function run()
    {
        $space = $this->getSpace();
        $space->removeIndex($this->name);
    }
}
