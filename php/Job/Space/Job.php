<?php

namespace Job\Space;

use Exception;
use Job\Database\Job as DatabaseJob;

abstract class Job extends DatabaseJob
{
    private $_space;
    public function getSpace()
    {
        if (!$this->_space) {
            if (!$this->space) {
                throw new Exception("Invalid params");
            }
            $this->_space = $this->getMapper()->getSchema()->getSpace($this->space);
        }
        return $this->_space;
    }
}
