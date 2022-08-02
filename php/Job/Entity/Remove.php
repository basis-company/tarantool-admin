<?php

namespace Job\Entity;

use Job\Space\Job;
use Exception;
use stdClass;

class Remove extends Job
{
    public stdClass $id;

    public function run(): void
    {
        $space = $this->getSpace();

        if (!$space->getProperties()) {
            $data = [];
            foreach ($this->id as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            $pk = [];
            foreach ($space->getIndexes()[0]->parts as $part) {
                $pk[] = $data[array_key_exists(0, $part) ? $part[0] : $part['field']];
            }

            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->delete($pk);
        } else {
            $params = get_object_vars($this->id);

            if (!count($params)) {
                throw new Exception("Invalid params");
            }
            $entity = $space->getRepository()
                ->findOne($params);

            $this->getMapper()->remove($entity);
        }
    }
}
