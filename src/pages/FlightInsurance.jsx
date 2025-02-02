import {
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Select,
  Skeleton,
  SkeletonCircle,
  Text,
} from '@chakra-ui/react'
import axios from 'axios'

import React, { useEffect, useState } from 'react'
import BasicButton from '../components/buttons/BasicButton'
import FlightInsuranceCard from '../components/cards/FlightInsuranceCard'
import { getAccessToken } from '../utils/tokenStore'
import { useAuth } from '../contexts/AuthContext'
import Chittybang from '../images/chittybang.jpg'
import LoadingPage from './LoadingPage'

const defaultDepartAt = new Date(Date.now() + 600 * 60 * 1000)
  .toISOString()
  .slice(0, 16) // 현재 시간에서 1시간 뒤
const defaultArrivalAt = new Date(
  new Date(defaultDepartAt).getTime() + 33 * 60 * 60 * 1000,
)
  .toISOString()
  .slice(0, 16) // 출발 시간에서 24시간 뒤
const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
}
const defaultBirthday = '20050101'

const BASE_URL = import.meta.env.VITE_BASE_URL

const FlightInsurance = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isClicked, setIsClicked] = useState([false, false, false])
  const [departAt, setDepartAt] = useState(defaultDepartAt)
  const [arrivalAt, setArrivalAt] = useState(defaultArrivalAt)
  const [birthDay, setBirthday] = useState(defaultBirthday)
  const [gender, setGender] = useState(Gender.MALE)
  const [planName, setPlanName] = useState('')
  const [error, setError] = useState('')
  const [responseData, setResponseData] = useState([])
  const today = new Date()
  const storedData = JSON.parse(
    window.sessionStorage.getItem('flightInsuranceData'),
  )
  const accessToken = getAccessToken()
  const { user } = useAuth()

  useEffect(() => {
    if (
      storedData &&
      storedData.departAt &&
      storedData.arrivalAt &&
      storedData.birthDay &&
      storedData.gender &&
      storedData.planName &&
      storedData.searchData &&
      storedData.category
    ) {
      const parsedData = {
        departAt: storedData.departAt,
        arrivalAt: storedData.arrivalAt,
        birthDay: storedData.birthDay,
        gender: storedData.gender,
        planName: storedData.planName,
        searchData: JSON.parse(storedData.searchData),
        category: JSON.parse(storedData.category),
      }

      setDepartAt(parsedData.departAt)
      setArrivalAt(parsedData.arrivalAt)
      setBirthday(parsedData.birthDay)
      setGender(parsedData.gender)
      setPlanName(parsedData.planName)
      setIsClicked(parsedData.category)
      setResponseData(parsedData.searchData)
    } else {
      setDepartAt(defaultDepartAt)
      setArrivalAt(defaultArrivalAt)
      setBirthday(defaultBirthday)
      setGender(Gender.MALE)
      setPlanName('standard')
      setIsClicked([false, false, false])
      setResponseData([])
    }
  }, [])

  useEffect(() => {
    const dataToStore = {
      departAt,
      arrivalAt,
      birthDay,
      gender,
      planName,
      category: JSON.stringify(isClicked),
      searchData: JSON.stringify(responseData),
    }

    window.sessionStorage.setItem(
      'flightInsuranceData',
      JSON.stringify(dataToStore),
    )
  }, [departAt, arrivalAt, birthDay, gender, planName, isClicked, responseData])

  const fetchUserInfo = async () => {
    if (user.name) {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/mypages`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (response.status === 200) {
          const cleanedBirthDay = response.data.birthDate.replace(/\D/g, '')
          const cleanedGender =
            response.data.gender === '남자' ? 'MALE' : 'FEMALE'
          setBirthday(cleanedBirthDay)
          setGender(cleanedGender)
        }
      } catch (error) {
        if (error.response.status >= 401) {
          console.error('존재하지않는 회원')
        }
      }
    } else {
      if (!storedData.birthDate || !storedData.gender) {
        setBirthday(defaultBirthday)
        setGender('MALE')
      }
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [user])

  useEffect(() => {
    handleSearch()
  }, [planName])

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    return maxDate.toISOString().slice(0, 16)
  }

  const handleDepartAtChange = (e) => {
    setDepartAt(e.target.value)
  }

  const handleArrivalAtChange = (e) => {
    setArrivalAt(e.target.value)
  }

  const handleBirthDayChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value === e.target.value) {
      setBirthday(value)
    }
  }

  const handleGenderClick = (selectedGender) => {
    setGender(selectedGender)
  }

  const handleContractClick = (index) => {
    const updatedClicks = [...isClicked]
    updatedClicks[index] = !updatedClicks[index]
    setIsClicked(updatedClicks)
  }

  const handlePlanClick = (e) => {
    const selectedPlan = e.target.value
    setPlanName(selectedPlan)
  }

  const toLocalDate = (dateString) => {
    if (!dateString) return ''
    const year = dateString.substring(0, 4)
    const month = dateString.substring(4, 6)
    const day = dateString.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  const handleSearch = async () => {
    setIsLoading(true)

    if (!departAt || !arrivalAt || !birthDay || !gender) {
      setError('모든 입력 항목을 작성해주세요.')
      alert('모든 입력 항목을 작성해주세요.')
      return
    }

    if (new Date(arrivalAt) < new Date(departAt)) {
      setError('도착 날짜는 출발 날짜보다 빨라야 합니다.')
      alert('도착 날짜는 출발 날짜보다 빨라야 합니다.')
      return
    }

    const oneDay = 24 * 60 * 60 * 1000
    if (new Date(arrivalAt) - new Date(departAt) < oneDay) {
      alert('여행기간은 1일 이상이어야 합니다.')
      return
    }

    if (birthDay.length !== 8) {
      alert('생년월일 8자리를 입력해주세요')
      return
    }

    const requestData = {
      departAt: departAt,
      arrivalAt: arrivalAt,
      birthDay: toLocalDate(birthDay),
      gender: gender,
      planName: planName,
      flightDelay: isClicked[0],
      passportLoss: isClicked[1],
      foodPoisoning: isClicked[2],
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/v1/flight-insurances/search`,
        {
          params: requestData,
        },
      )
      setResponseData(response.data)
      setIsLoading(false)
    } catch (error) {
      if (error.response.status >= 400 && error.response.status < 600) {
        alert('여행자 보험 상품을 조회하는데 실패했습니다. 다시 검색해 주세요.')
      }
    }
  }

  return (
    <>
      {isLoading ? (
        <LoadingPage>
          <Flex
            w={'100%'}
            h={'100%'}
            flexDirection={'column'}
            overflow={'hidden'}
          >
            <Flex
              direction={'column'}
              justifyContent={'center'}
              m={'0 auto'}
              mt={'100px'}
              w="70%"
              minH={'347px'}
              border={'1px solid'}
              borderColor={'gray.100'}
              p={'40px'}
              borderRadius="10px"
            >
              <Flex justifyContent={'space-between'}>
                <Skeleton
                  w={'309px'}
                  height={'49px'}
                  borderRadius={'10px'}
                  mr={'30px'}
                ></Skeleton>
                <Skeleton
                  w={'309px'}
                  height={'49px'}
                  borderRadius={'10px'}
                ></Skeleton>
              </Flex>
              <Flex justifyContent={'space-between'} mt={'30px'}>
                <Skeleton
                  w={'309px'}
                  height={'49px'}
                  borderRadius={'10px'}
                  mr={'30px'}
                ></Skeleton>
                <Skeleton
                  w={'309px'}
                  height={'49px'}
                  borderRadius={'10px'}
                ></Skeleton>
              </Flex>
              <Skeleton
                mt={'30px'}
                w={'80%'}
                height={'25px'}
                borderRadius={'10px'}
              ></Skeleton>
              <Skeleton
                mt={'30px'}
                w={'60%'}
                height={'25px'}
                borderRadius={'10px'}
              ></Skeleton>
            </Flex>
            <Grid mt={'50px'} templateColumns="repeat(3, 1fr)" my={8} gap={10}>
              <Flex
                direction={'column'}
                gap={5}
                border={'solid 1px'}
                borderColor={'gray.100'}
                borderRadius={10}
                width={310}
                height={350}
                p={5}
              >
                <Flex w={'100%'} alignItems={'center'} gap={3}>
                  <SkeletonCircle size={'10'}></SkeletonCircle>
                  <Box w={'80%'}>
                    <Skeleton
                      w={'50%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                    <Skeleton
                      mt={3}
                      w={'100%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                  </Box>
                </Flex>
                <Flex direction={'column'} gap={4} w={'100%'}>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
                <Flex
                  flex={1}
                  justifyContent={'flex-end'}
                  alignItems={'center'}
                >
                  <Skeleton
                    mt={3}
                    w={'50%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
              </Flex>
              <Flex
                direction={'column'}
                gap={5}
                border={'solid 1px'}
                borderColor={'gray.100'}
                borderRadius={10}
                width={310}
                height={350}
                p={5}
              >
                <Flex w={'100%'} alignItems={'center'} gap={3}>
                  <SkeletonCircle size={'10'}></SkeletonCircle>
                  <Box w={'80%'}>
                    <Skeleton
                      w={'50%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                    <Skeleton
                      mt={3}
                      w={'100%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                  </Box>
                </Flex>
                <Flex direction={'column'} gap={4} w={'100%'}>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
                <Flex
                  flex={1}
                  justifyContent={'flex-end'}
                  alignItems={'center'}
                >
                  <Skeleton
                    mt={3}
                    w={'50%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
              </Flex>
              <Flex
                direction={'column'}
                gap={5}
                border={'solid 1px'}
                borderColor={'gray.100'}
                borderRadius={10}
                width={310}
                height={350}
                p={5}
              >
                <Flex w={'100%'} alignItems={'center'} gap={3}>
                  <SkeletonCircle size={'10'}></SkeletonCircle>
                  <Box w={'80%'}>
                    <Skeleton
                      w={'50%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                    <Skeleton
                      mt={3}
                      w={'100%'}
                      height={'25px'}
                      borderRadius={'10px'}
                    ></Skeleton>
                  </Box>
                </Flex>
                <Flex direction={'column'} gap={4} w={'100%'}>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                  <Skeleton
                    mt={3}
                    w={'100%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
                <Flex
                  flex={1}
                  justifyContent={'flex-end'}
                  alignItems={'center'}
                >
                  <Skeleton
                    mt={3}
                    w={'50%'}
                    height={'25px'}
                    borderRadius={'10px'}
                  ></Skeleton>
                </Flex>
              </Flex>
            </Grid>
          </Flex>
        </LoadingPage>
      ) : (
        <Flex
          flexDirection={'column'}
          justifyContent={'center'}
          alignItems={'center'}
          marginTop={'50px'}
        >
          {/* 검색폼 */}
          <Flex
            m={'0 auto'}
            w="800px"
            borderRadius="10px"
            border="1px solid"
            borderColor="gray.100"
            backgroundColor="white"
            flexDirection={'column'}
            alignItems={'center'}
            mt={'50px'}
            p={'40px'}
            py={'40px'}
          >
            <Flex
              w={'90%'}
              justifyContent={'space-between'}
              alignItems={'center'}
            >
              <Input
                mr={'30px'}
                width={'309px'}
                height={'49px'}
                borderRadius={'10px'}
                borderWidth={'1px'}
                borderColor={'gray.200'}
                focusBorderColor={'main'}
                type="datetime-local"
                placeholder="출발 날짜"
                min={new Date(today.getTime() + 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16)}
                max={getMaxDate()}
                value={departAt}
                onChange={handleDepartAtChange}
              />
              <Input
                width={'309px'}
                height={'49px'}
                borderRadius={'10px'}
                borderWidth={'1px'}
                borderColor={'gray.200'}
                focusBorderColor={'main'}
                type="datetime-local"
                placeholder="도착 날짜"
                min={new Date(today.getTime() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16)}
                max={getMaxDate()}
                value={arrivalAt}
                onChange={handleArrivalAtChange}
              />
            </Flex>

            <Box marginTop={'30px'} display={'flex'} alignItems={'center'}>
              <Input
                marginRight={'30px'}
                width={'309px'}
                height={'49px'}
                borderRadius={'10px'}
                borderWidth={'1px'}
                borderColor={'gray.200'}
                focusBorderColor={'main'}
                type="text"
                maxLength={8}
                placeholder="생년월일 ex)19980517"
                value={birthDay}
                onChange={handleBirthDayChange}
              />
              <Box>
                <BasicButton
                  width={'154px'}
                  height={'49px'}
                  borderColor={'gray.200'}
                  borderRadius={'10px 0px 0px 10px'}
                  border={'1px solid'}
                  color={gender === Gender.MALE ? 'main' : 'gray.200'}
                  bgColor={'white'}
                  _hover={{ color: 'main' }}
                  onClick={() => {
                    handleGenderClick(Gender.MALE)
                  }}
                >
                  남
                </BasicButton>
                <BasicButton
                  width={'154px'}
                  height={'49px'}
                  borderRadius={'0px 10px 10px 0px'}
                  color={gender === Gender.FEMALE ? 'main' : 'gray.200'}
                  border={'1px solid'}
                  bgColor={'white'}
                  _hover={{ color: 'main' }}
                  onClick={() => {
                    handleGenderClick(Gender.FEMALE)
                  }}
                >
                  여
                </BasicButton>
              </Box>
            </Box>

            <Box>
              <Box
                display={'flex'}
                textAlign={'center'}
                marginTop={'30px'}
                marginRight={'210px'}
              >
                <Text pt={'1px'} fontSize={'lg'} mr={'20px'}>
                  세부특약
                </Text>
                {/* 각 특약 조항 버튼을 배열로 매핑하여 동적으로 생성 */}
                {isClicked.map((clicked, index) => {
                  return (
                    <BasicButton
                      marginRight={'15px'}
                      width={'100px'}
                      height={'30px'}
                      bgColor={'white'}
                      border={'1px solid'}
                      color={clicked ? 'main' : 'gray.200'}
                      _hover={{ color: 'main' }}
                      key={index}
                      onClick={() => {
                        return handleContractClick(index)
                      }}
                    >
                      {index === 0
                        ? '항공기지연'
                        : index === 1
                          ? '여권분실'
                          : '식중독'}
                    </BasicButton>
                  )
                })}
              </Box>
            </Box>

            <Box width="100%" textAlign={'center'} mt={'30px'}>
              <Button
                color="white"
                width="100%"
                bgImage={Chittybang}
                bgSize={'cover'}
                height="45px"
                _hover={{ bgColor: 'none' }}
                _focus={{ bgColor: 'none' }}
                _active={{ bgColor: 'none' }}
                onClick={handleSearch}
              >
                검색하기
              </Button>
            </Box>
          </Flex>
          {/* 플랜선택 */}
          <Flex
            justifyContent={'space-between'} // 텍스트와 셀렉트를 각각 왼쪽과 오른쪽에 정렬합니다.
            marginTop={'50px'}
            width={'1000px'} // 너비를 명시적으로 설정하여 부모 요소의 너비에 맞춰 정렬될 수 있도록 합니다.
          >
            <Box>
              <Text color={'gray.600'} fontSize={'xl'}>
                조회결과
              </Text>
              <Text>
                {`총 ${responseData.length}개의 여행자보험상품이 조회되었습니다.`}
              </Text>
            </Box>
            <Select
              width={115}
              height={42}
              borderWidth={2}
              borderColor={'gray.200'}
              focusBorderColor={'main'}
              value={planName}
              onChange={handlePlanClick}
            >
              <option value="standard">표준플랜</option>
              <option value="advanced">고급플랜</option>
            </Select>
          </Flex>

          {/* 보험상품 카드 */}
          <Grid templateColumns="repeat(3, 1fr)" my={8} gap={10}>
            {responseData.map((card, index) => {
              return <FlightInsuranceCard key={index} card={card} />
            })}
          </Grid>
        </Flex>
      )}
    </>
  )
}

export default FlightInsurance
