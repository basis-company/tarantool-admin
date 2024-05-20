<?php

namespace Job\Row;

use Exception;
use stdClass;
use Symfony\Component\Uid\Uuid;

class Create extends Job
{
    public stdClass $values;

    public function run(): array
    {
        $space = $this->getSpace();

        $values = get_object_vars($this->values);

        foreach ($values as $k => $v) {
            $type = $space->getFieldFormat($k)['type'];
            if ($type === 'uuid') {
                $v = new Uuid($v);
            } elseif ($type == 'map') {
                if ($v !== null) {
                    if (is_string($v)) {
                        $v = json_decode($v);
                    }
                    if (!is_array($v) && !is_object($v)) {
                        throw new Exception("Invalid type for '$k' ($type): $values[$k]");
                    }
                    $v = $this->toArray($v);
                    if (!count($v)) {
                        $v = null;
                    }
                }
            } elseif (is_object($v)) {
                $v = $this->toArray($v);
            }
            $values[$k] = $v;
        }
        return ['row' => $space->create($values)];
    }
}
