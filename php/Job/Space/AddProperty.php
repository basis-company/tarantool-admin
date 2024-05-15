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
        $space = $this->getSpace();
        if (in_array($this->name, $space->getFields())) {
            throw new Exception("Property $this->name already exists");
        }

        $space->addProperty($this->name, $this->type, [
            'is_nullable' => $this->is_nullable,
        ]);
    }
}
