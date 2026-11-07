<?php

namespace Job\Space;

use Exception;

class RemoveProperty extends Job
{
    public string $name;

    public function run(): void
    {
        $instances = $this->getSpaceInstances();

        $reference = null;
        foreach ($instances as $instance) {
            if ($instance !== null) {
                $reference = $instance;
                break;
            }
        }

        if ($reference === null) {
            throw new Exception("Space $this->space does not exist");
        }

        $fields = $reference->getFields();
        $partsNumbers = [];
        foreach ($reference->mapper->find('_vindex', ['id' => $reference->getId()]) as $index) {
            foreach ($index['parts'] as $part) {
                $partsNumbers[] = (array_key_exists('field', $part) ? $part['field'] : $part[0]);
            };
        }

        if (!in_array($this->name, $fields)) {
            throw new Exception("Property $this->name does not exist");
        }

        if (!count($fields)) {
            $reference->getFieldFormat($this->name);
        }

        if (array_reverse($fields)[0] !== $this->name) {
            throw new Exception("Remove only last property");
        } elseif (in_array(array_search($this->name, $fields), $partsNumbers)) {
            throw new Exception("This property is the part of index. Remove related index first.");
        } else {
            foreach ($instances as $space) {
                if ($space === null) {
                    continue;
                }

                $format = $this->formatOf($space);
                array_pop($format);
                $space->mapper->client->call("box.space." . $space->getName() . ":format", $format);
            }
        }
    }
}
