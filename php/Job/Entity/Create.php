<?php

namespace Job\Entity;

use Exception;
use Job\Space\Job;
use Symfony\Component\Uid\Uuid;

class Create extends Job
{
    public $values;

    public function run()
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

            if (array_values($data) == $data) {
                $data = array_values($data);
            } else {
                throw new Exception('add null values');
            }

            // additional index-based type casting for data
            throw new Exception("Create instance without format not implemened");

            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->insert($data);

            return ['entity' => $data];
        } else {
            $values = get_object_vars($this->values);
            foreach ($values as $k => $v) {
                $type = $space->getProperty($k)['type'];
                if ($type == 'uuid') {
                    $v = new Uuid($v);
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
