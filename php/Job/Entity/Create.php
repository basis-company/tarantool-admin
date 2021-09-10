<?php

namespace Job\Entity;

use Basis\Converter;
use Job\Space\Job;
use Exception;
use stdClass;
use Symfony\Component\Uid\Uuid;

class Create extends Job
{
    public stdClass $values;

    public function run(Converter $converter): array
    {
        $space = $this->getSpace();

        if (!count($space->getFormat())) {
            $data = [];
            foreach ($this->values as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            if (array_values($data) === $data) {
                $data = array_values($data);
            } else {
                throw new Exception('add null values');
            }

            // additional index-based type casting for data
            throw new Exception("Create instance without format is not implemented");
            /*
            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->insert($data);

            return ['entity' => $data];
            */
        } else {
            $values = get_object_vars($this->values);
            foreach ($values as $k => $v) {
                $type = $space->getProperty($k)['type'];
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
                        $v = $converter->toArray($v);
                        if (!count($v)) {
                            $v = null;
                        }
                    }
                } elseif (is_object($v)) {
                    $v = $converter->toArray($v);
                }
                $values[$k] = $v;
            }
            $entity = $space->getRepository()->create($values);
            $this->getMapper()->save($entity);

            return ['entity' => $entity];
        }
    }
}
