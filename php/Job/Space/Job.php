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

        if (!$this->space) {
            throw new Exception('space name is not defined');
        }

        return $this->spaceInstance = $this->getMapper()->getSchema()->getSpace($this->space);
    }

    public function trimTail($arr): array
    {
        $trimArr = [];
        foreach ($arr as $value) {
            if ($value === null) {
                break;
            }
            $trimArr[] = $value;
        }
        return $trimArr;
    }
}
