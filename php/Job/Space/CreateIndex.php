<?php

namespace Job\Space;

use Exception;

class CreateIndex extends Job
{
    public string $name;
    public array|string $fields;
    public array|string $parts;
    public bool $unique;
    public string $type;

    public function run(): void
    {
        $space = $this->getSpace();

        if (is_array($this->parts)) {
            $spaceId = $space->getId();
            $options = [
                'type' => $this->type,
                'unique' => $this->unique,
                'parts' => $this->parts,
            ];
            $space->getMapper()->getClient()->call("box.space[$spaceId]:create_index", $this->name, [$options]);
        } elseif (is_array($this->fields)) {
            $format = $space->getFormat();

            $fields = [];
            foreach ($this->fields as $index) {
                $fields[] = $format[$index]['name'];
            }

            $space->createIndex([
                'name' => $this->name,
                'fields' => $fields,
                'unique' => $this->unique,
                'type' => $this->type,
            ]);
        } else {
            throw new Exception("Invalid index configuration: " . json_encode([
                'name' => $this->name,
                'type' => $this->type,
            ]));
        }
    }
}
