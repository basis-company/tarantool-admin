<?php

namespace Job\Row;

use Exception;
use stdClass;
use Symfony\Component\Uid\Uuid;
use Tarantool\Client\Schema\Operations;

class Update extends Job
{
    public stdClass $values;

    public function run(): void
    {
        $pk = [];
        $space = $this->getSpace();

        $format = $this->getFormat();
        foreach ($this->getMapper()->find('_vindex', ['id' => $space->getId()])[0]['parts'] as $part) {
            $fieldName = $format[array_key_exists(0, $part) ? $part[0] : $part['field']]['name'];
            $pk[$fieldName] = $this->values->$fieldName;
        }
        $row = $space->findOrFail($pk);
        $changes = [];
        foreach ($this->values as $k => $v) {
            $type = $space->getFieldFormat($k)['type'];
            if ($type === 'uuid') {
                $v = new Uuid($v);
            } elseif ($type == '*') {
                if (is_object($v)) {
                    $v = $this->toArray($v);
                }
            } elseif ($type == 'map') {
                if ($v !== null) {
                    if (is_string($v)) {
                        $v = json_decode($v);
                    }
                    if (!is_array($v) && !is_object($v)) {
                        $extra = '';
                        if (is_string($this->values->$k)) {
                            $extra .= ': ' . $this->values->$k;
                        }
                        throw new Exception("Invalid type for '$k' ($type)$extra");
                    }
                    $v = $this->toArray($v);
                    if (!count($v)) {
                        $v = null;
                    }
                }
            } elseif ($type == 'unsigned') {
                if (is_string($v)) {
                    $v = intval($v);
                }
            } elseif ($type == 'number') {
                if (is_string($v)) {
                    $v = floatval($v);
                }
            }
            $changes[$k] = $v;
        }
        $space->update($row, $changes);
    }
}
