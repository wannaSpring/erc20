import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Tooltip,
  Card,
  CardBody,
  Stack,
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react'
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());

function App() {
  const toast = useToast();
  const [userAddress, setUserAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userBalance, setUserBalance] = useState(BigInt(0));
  const [isConnected, setIsConnected] = useState(false);
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsloading] = useState(false);

  const connectwalletHandler = () => {
    if (provider) {
      provider.send("eth_requestAccounts", []).then(async (res) => {
        console.log(res);
        await accountChangedHandler(provider.getSigner());
        setIsConnected(true);
      })
    } else {
      setErrorMessage("Please Install Metamask!!!");
    }
  }
  const accountChangedHandler = async (newAccount) => {
    const address = await newAccount.getAddress();
    setUserAddress(address);
    const balance = await newAccount.getBalance()
    setUserBalance(ethers.utils.formatEther(balance));
    console.log(address, 'address');
  }


  const resultToast = (status, title) => {
    return toast({
      position: "top",
      title: title,
      status: status,
      duration: 3000,
      isClosable: true,
    })
  }


  // useEffect(() => {
  //   connectwalletHandler();
  // }, [])

  useEffect(() => {
    console.log(toast)
    console.log(errorMessage)
    if (errorMessage) {
      resultToast('error', errorMessage)
    }
  }, [errorMessage, toast])

  async function getTokenBalance() {
    if (!userAddress) {
      setErrorMessage("u must input address or connect to ur wallet");
      return;
    }
    setIsloading(true)
    try {
      const config = {
        apiKey: 'dM6ltIDVx4l0csBx7-8uvDr1AZMzGN42',
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);
      const data = await alchemy.core.getTokenBalances(userAddress);

      setResults(data);

      const tokenDataPromises = [];

      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenData = alchemy.core.getTokenMetadata(
          data.tokenBalances[i].contractAddress
        );
        tokenDataPromises.push(tokenData);
      }

      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
      setIsloading(false);
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setIsloading(false);
    }
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
          <Button
            disabled={isConnected}
            colorScheme={isConnected ? "red" : "green"}
            onClick={connectwalletHandler}>
            {isConnected ? "Connected!!!" : "Connect"}
          </Button>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          value={userAddress}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue" isLoading={isLoading}>
          Check ERC-20 Token Balances
        </Button>



        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (

                <Card maxW='sm'>
                  <CardBody>
                    {
                      tokenDataObjects[i].logo && (<Image
                        src={tokenDataObjects[i].logo}
                        alt={tokenDataObjects[i].symbol}
                        borderRadius='lg'
                      />)
                    }
                    <Stack mt='6' spacing='3'>
                      <Heading size='md'>{tokenDataObjects[i].symbol}</Heading>
                      <Tooltip label={Utils.formatUnits(
                        e.tokenBalance,
                        tokenDataObjects[i].decimals
                      )}
                        hasArrow
                        bg='gray.300' color='black'
                      >
                        <Box>
                          <b>Balance:</b>&nbsp;
                          {Utils.formatUnits(
                            e.tokenBalance,
                            tokenDataObjects[i].decimals
                          )}
                        </Box>
                      </Tooltip>
                    </Stack>

                  </CardBody>

                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
