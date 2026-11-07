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
        if (!is_array($this->parts) && !is_array($this->fields)) {
            throw new Exception("Invalid index configuration: " . json_encode([
                'name' => $this->name,
                'type' => $this->type,
            ]));
        }

        $this->eachSpace(function ($space) {
            if (is_array($this->parts)) {
                $spaceId = $space->getId();
                $options = [
                    'type' => $this->type,
                    'unique' => $this->unique,
                    'parts' => json_decode(json_encode($this->parts), true),
                ];
                $space->mapper->client->evaluate(
                    "return box.space[$spaceId]:create_index(...)",
                    $this->name,
                    $options
                );
            } else {
                $space->addIndex($this->fields, [
                    'name' => $this->name,
                    'unique' => $this->unique,
                    'type' => $this->type,
                ]);
            }
        });
    }
}
