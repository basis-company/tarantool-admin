<?php

namespace Job\Entity;

use Job\Space\Job;

class RemoveFromSelect extends Job
{
    public $key;

    public function run()
    {
        $space = $this->getSpace();

        if (!$space->getFormat()) {
            $data = [];
            foreach ($this->key as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            $pk = [];
            foreach ($space->getIndexes()[0]['parts'] as $part) {
                $pk[] = $data[$part[0]];
            }

            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->delete($pk);
        } else {
            $entity = $space->getRepository()
                ->findOne(get_object_vars($this->key));

            $this->getMapper()->remove($entity);
        }
    }
}