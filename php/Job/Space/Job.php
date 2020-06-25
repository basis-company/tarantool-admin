<?php

namespace Job\Space;

use Exception;
use Job\Database\Job as DatabaseJob;

abstract class Job extends DatabaseJob
{
    private $space;
    public function getSpace()
    {
        if (!$this->space) {
            if (!$this->space) {
                throw new Exception("Invalid params");
            }
            $this->space = $this->getMapper()->getSchema()->getSpace($this->space);
        }
        return $this->space;
    }
}
