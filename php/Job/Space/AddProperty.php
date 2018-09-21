<?php

namespace Job\Space;

use Exception;

class AddProperty extends Job
{
    public $name;
    public $type;
    public $is_nullable;

    public function run()
    {
        $space = $this->getSpace();

        if ($space->hasProperty($this->name)) {
            throw new Exception("Property $this->name exists");
        }

        $space->addProperty($this->name, $this->type, [
            'is_nullable' => $this->is_nullable
        ]);
    }
}
