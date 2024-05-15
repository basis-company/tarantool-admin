<?php

namespace Job\Space;

use Job\Database\Job as DatabaseJob;
use Exception;
use Tarantool\Mapper\Space;

abstract class Job extends DatabaseJob
{
    public int $index;
    public string $space;
    public string $truncateButtonText;
    private Space $spaceInstance;

    public function getSpace(): Space
    {
        if (isset($this->spaceInstance)) {
            return $this->spaceInstance;
        }

        if (!$this->space) {
            throw new Exception('space name is not defined');
        }

        return $this->spaceInstance = $this->getMapper()->getSpace($this->space);
    }

    public function getFormat()
    {
        $format = [];
        foreach ($this->spaceInstance->getFields() as $field) {
            $format[] = $this->spaceInstance->getFieldFormat($field);
        }
        return $format;
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
