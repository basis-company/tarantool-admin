<?php

namespace Job\Space;

use Exception;

class RemoveProperty extends Job
{
    public string $name;

    public function run(): void
    {
        $space = $this->getSpace();
        $spaceName = $space->getName();
        $fields = $space->getFields();
        $partsNumbers = [];
        foreach ($space->mapper->find('_vindex', ['id' => $space->getId()]) as $index) {
            foreach ($index['parts'] as $part) {
                $partsNumbers[] = (array_key_exists('field', $part) ? $part['field'] : $part[0]);
            };
        }

        if (!in_array($this->name, $fields)) {
            throw new Exception("Property $this->name does not exist");
        }

        if (!count($fields)) {
            $space->getFieldFormat($this->name);
        }

        if (array_reverse($fields)[0] !== $this->name) {
            throw new Exception("Remove only last property");
        } elseif (in_array(array_search($this->name, $fields), $partsNumbers)) {
            throw new Exception("This property is the part of index. Remove related index first.");
        } else {
            $format = $this->getFormat();
            array_pop($format);
            $space->mapper->client->call("box.space.$spaceName:format", $format);
        }
    }
}
