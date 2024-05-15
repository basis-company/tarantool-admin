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
            $space->mapper->client->call("box.space[$spaceId]:create_index", $this->name, [$options]);
        } elseif (is_array($this->fields)) {
            $space->addIndex($this->fields, [
                'name' => $this->name,
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
