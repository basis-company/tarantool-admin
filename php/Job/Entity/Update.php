<?php

namespace Job\Entity;

use Basis\Converter;
use Exception;
use Job\Space\Job;
use Symfony\Component\Uid\Uuid;
use Tarantool\Client\Schema\Operations;

class Update extends Job
{
    public $values;

    public function run(Converter $converter)
    {
        $pk = [];
        $space = $this->getSpace();

        if (!count($space->getFormat())) {
            $data = [];
            foreach ($this->values as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            $pk = [];
            foreach ($space->getIndexes()[0]['parts'] as $part) {
                $value = $data[$part[0]];
                unset($data[$part[0]]);
                if (array_key_exists(1, $part) && $part[1] == 'unsigned') {
                    $value = +$value;
                }
                $pk[] = $value;
            }

            $operations = null;
            foreach ($data as $index => $value) {
                if (!$operations) {
                    $operations = Operations::set($index, $value);
                } else {
                    $operations = $operations->andSet($index, $value);
                }
            }

            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->update($pk, $operations);
        } else {
            foreach ($space->getPrimaryIndex()['parts'] as $part) {
                $pk[] = $this->values->{$space->getFormat()[$part[0]]['name']};
            }

            $entity = $space->getRepository()->findOne($pk);
            foreach ($this->values as $k => $v) {
                $type = $space->getProperty($k)['type'];
                if ($type == 'uuid') {
                    $v = new Uuid($v);
                } elseif (is_object($v)) {
                    $v = $converter->toArray($v);
                }
                $entity->$k = $v;
            }
            $this->getMapper()->save($entity);
        }
    }
}
