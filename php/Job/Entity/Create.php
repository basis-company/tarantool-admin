<?php

namespace Job\Entity;

use Job\Space\Job;
use Exception;

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
                $data[$k-1] = $v;
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
            $entity = $space->getRepository()->create(get_object_vars($this->values));
            $this->getMapper()->save($entity);

            return ['entity' => $entity];
        }
    }
}
