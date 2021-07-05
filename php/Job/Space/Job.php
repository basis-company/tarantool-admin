<?php

namespace Job\Space;

use Job\Database\Job as DatabaseJob;
use Exception;
use Tarantool\Mapper\Space;

abstract class Job extends DatabaseJob
{
    public string $space;
    private Space $spaceInstance;

    public function getSpace(): Space
    {
        if (isset($this->spaceInstance)) {
            return $this->spaceInstance;
        }

        return $this->spaceInstance = $this->space
            ? $this->getMapper()->getSchema()->getSpace($this->space)
            : throw new Exception('Space name is not defined');
    }
}
