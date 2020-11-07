<?php

namespace Job\Space;


use Tarantool\Client\Client;
use Tarantool\Client\Schema\Criteria;

//$client = Client::fromDefaults();
//$client = Client::fromOptions([
  //      'uri' => 'tcp://127.0.0.1:3301',
    //    'username' => '<username>',
      //  'password' => '<password>'

//);





class Truncate extends Job
{


    public function run()
    {

         $test = $_POST['rpc'];
        $test1 = json_decode($test,true);



        $client = $this->getMapper()->getClient()->getSpace($this->space);
        $result = $client->select(Criteria::index($test1['params']['index'])->andKey($test1['params']['key']));


        foreach ($result as &$value){
            $client->delete([$value[0]]);


        }



        return $result;

    }

}
