<?php

namespace Job\Space;

use Exception;

class CreateIndex extends Job
{
    public $name;
    public $fields;
    public $unique;
    public $type;

    public function run()
    {
        $space = $this->getSpace();
        $format = $space->getFormat();

        $fields = [];
        foreach($this->fields as $index) {
            $fields[] = $format[$index]['name'];
        }

        $space->createIndex([
            'name' => $this->name,
            'fields' => $fields,
            'unique' => $this->unique,
            'type' => $this->type,
        ]);
    }
}
