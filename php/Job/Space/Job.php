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

    /**
     * Space instances for every host of the list. Null stands for a host
     * without this space.
     */
    public function getSpaceInstances(): array
    {
        $spaces = [];

        foreach ($this->getMappers() as $dsn => $mapper) {
            $spaces[$dsn] = $mapper->hasSpace($this->space)
                ? $mapper->getSpace($this->space)
                : null;
        }

        return $spaces;
    }

    /**
     * Applies a callback to the space on every host. Hosts without the
     * space are skipped when $skipMissing, otherwise the first one fails
     * the job.
     */
    protected function eachSpace(callable $fn, bool $skipMissing = false): void
    {
        foreach ($this->getSpaceInstances() as $dsn => $space) {
            if ($space === null) {
                if ($skipMissing) {
                    continue;
                }

                throw new Exception("Space $this->space does not exist on $dsn");
            }

            $fn($space);
        }
    }

    public function formatOf(Space $space): array
    {
        $format = [];
        foreach ($space->getFields() as $field) {
            $format[] = $space->getFieldFormat($field);
        }
        return $format;
    }

    public function indexNameOf(Space $space, int $iid): ?string
    {
        foreach ($space->mapper->find('_vindex', ['id' => $space->getId()]) as $index) {
            if ($index['iid'] == $iid) {
                return $index['name'];
            }
        }

        return null;
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
