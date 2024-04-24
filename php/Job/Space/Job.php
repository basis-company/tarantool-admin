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

        return $this->spaceInstance = $this->getMapper()->getSchema()->getSpace($this->space);
    }

    public function getSpaceIndexes()
    {
        $indexes = $this->spaceInstance->mapper->find('_vindex', [
            'id' => $this->spaceInstance->id,
        ]);
        return $indexes;
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
