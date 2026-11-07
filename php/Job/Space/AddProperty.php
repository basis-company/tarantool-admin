<?php

namespace Job\Space;

use Exception;

class AddProperty extends Job
{
    public string $name;
    public string $type;
    public bool $is_nullable;

    public function run(): void
    {
        $exists = false;
        $added = false;

        foreach ($this->getSpaceInstances() as $dsn => $space) {
            if ($space === null) {
                throw new Exception("Space $this->space does not exist on $dsn");
            }

            if (in_array($this->name, $space->getFields())) {
                $exists = true;
                continue;
            }

            $space->addProperty($this->name, $this->type, [
                'is_nullable' => $this->is_nullable,
            ]);

            $added = true;
        }

        if ($exists && !$added) {
            throw new Exception("Property $this->name already exists");
        }
    }
}
