<?php

namespace Job\Space;

use Exception;
use Job\Database\Job as DatabaseJob;

abstract class Job extends DatabaseJob
{
    private $spaceInstance;
    public function getSpace()
    {
        if (!$this->spaceInstance) {
            if (!$this->space) {
                throw new Exception("Invalid params");
            }
            $this->spaceInstance = $this->getMapper()->getSchema()->getSpace($this->space);
        }
        return $this->spaceInstance;
    }
}
