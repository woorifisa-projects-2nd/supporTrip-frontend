import { Divider, Flex, Heading, Text } from '@chakra-ui/react'
import axios from 'axios'
import { format } from 'date-fns'
import ko from 'date-fns/locale/ko'
import React, { useEffect, useState } from 'react'
import BasicButton from '../../components/buttons/BasicButton'
import MoneyInput from '../../components/inputs/MoneyInput'
import { formatNumberWithCommas } from '../../utils/numberUtils'
import { getAccessToken } from '../../utils/tokenStore'

const BASE_URL = import.meta.env.VITE_BASE_URL
const startDate = format(new Date(), 'yyyy-MM-dd')

const FinalCheckForm = ({
  previousStep,
  nextStep,
  exchangeData,
  updateExchangeData,
}) => {
  const accessToken = getAccessToken()
  const [isFilled, setIsFilled] = useState(false)
  const [availablePoint, setAvailablePoint] = useState(
    exchangeData.availablePoint || 0,
  )
  const [targetExchangeRate, setTargetExchangeRate] = useState(
    exchangeData.targetExchangeRate || null,
  )
  const [point, setPoint] = useState(exchangeData.point || null)

  const labelStyles = {
    color: 'gray.400',
    fontWeight: 600,
  }

  useEffect(() => {
    if (!availablePoint) {
      fetchAvailablePoint()
    }

    if (exchangeData.strategy.code === 'STABLE') {
      setIsFilled(true)
      return
    }

    if (targetExchangeRate > 0) {
      setIsFilled(true)
      updateExchangeData({ targetExchangeRate: targetExchangeRate })
    }

    if (!targetExchangeRate) {
      setIsFilled(false)
    }
  }, [targetExchangeRate])

  const fetchAvailablePoint = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/users/point`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.status === 200) {
        const data = response.data
        setAvailablePoint(data.point)
        updateExchangeData({ availablePoint: data.point })
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Flex flex={1} direction={'column'}>
      <Heading size={'lg'} color={'black.soft'}>
        최종 확인
      </Heading>
      <Flex
        my={'35px'}
        w={'100%'}
        direction={'column'}
        alignItems="center"
        fontSize={'md'}
      >
        <Flex w={'90%'} justifyContent={'space-between'}>
          <Text {...labelStyles}>거래 이름</Text>
          <Text>{exchangeData.displayName}</Text>
        </Flex>
        <Flex w={'90%'} mt={4} justifyContent={'space-between'}>
          <Text {...labelStyles}>거래 시작일</Text>
          <Text>
            {format(startDate, 'yyyy년 MM월 dd일 EE요일', { locale: ko })}
          </Text>
        </Flex>
        <Flex w={'90%'} mt={4} justifyContent={'space-between'}>
          <Text {...labelStyles}>거래 종료일</Text>
          <Text>
            {format(exchangeData.completeDate, 'yyyy년 MM월 dd일 EE요일', {
              locale: ko,
            })}
          </Text>
        </Flex>

        <Divider color={'gray.200'} my={6}></Divider>

        <Flex w={'90%'} justifyContent={'space-between'}>
          <Text {...labelStyles}>환전 외화</Text>
          <Text>{exchangeData.targetCurrencyName}</Text>
        </Flex>
        <Flex w={'90%'} mt={4} justifyContent={'space-between'}>
          <Text {...labelStyles}>환전 유형</Text>
          <Text>{exchangeData.strategy.title}</Text>
        </Flex>
        {exchangeData.strategy.code === 'TARGET' && (
          <Flex w={'90%'} mt={4} justifyContent={'space-between'}>
            <Text {...labelStyles}>목표 환율</Text>
            <Flex direction={'column'}>
              <Flex alignItems={'center'}>
                <MoneyInput
                  size={'md'}
                  defaultNumber={targetExchangeRate}
                  getNumber={setTargetExchangeRate}
                // TODO: 최근 6개월 평균 환율로 최저값 설정
                ></MoneyInput>
                <Text ml={2}>원</Text>
              </Flex>
              <Text
                fontSize={'16px'}
                textAlign={'right'}
                mt={1}
                mr={'30px'}
                color={'blue.600'}
              >
                {`현재 기준 ${exchangeData.startingExchangeUnit} ${exchangeData.targetCurrencyName} = ${formatNumberWithCommas(exchangeData.startingExchangeRate.toFixed(2))} 원`}
              </Text>
            </Flex>
          </Flex>
        )}
        <Divider color={'gray.200'} my={6}></Divider>
        <Flex
          w={'90%'}
          justifyContent={'space-between'}
          alignItems={'flex-start'}
        >
          <Text {...labelStyles}>충전금</Text>
          <Text>{formatNumberWithCommas(exchangeData.tradingAmount)} 원</Text>
        </Flex>
        <Flex w={'90%'} mt={4} justifyContent={'space-between'}>
          <Text {...labelStyles}>포인트 사용</Text>
          <Flex direction={'column'}>
            <Flex alignItems={'center'}>
              <MoneyInput
                size={'md'}
                defaultNumber={point}
                getNumber={(value) => {
                  setPoint(value)
                  updateExchangeData({ point: value })
                }}
                max={availablePoint}
              ></MoneyInput>
              <Text ml={2}>P</Text>
            </Flex>
            <Text
              fontSize={'16px'}
              textAlign={'right'}
              mt={1}
              mr={'30px'}
              color={'blue.600'}
            >
              {`(보유 포인트: ${formatNumberWithCommas(availablePoint)} P)`}
            </Text>
          </Flex>
        </Flex>
        <Flex
          w={'100%'}
          justifyContent={'space-between'}
          alignItems={'center'}
          bg={'mint.100'}
          py={3}
          px={6}
          mt={8}
        >
          <Heading size={'md'}>계좌출금금액</Heading>
          <Heading size={'md'} color={'main'}>
            {formatNumberWithCommas(exchangeData.tradingAmount - point)} 원
          </Heading>
        </Flex>
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'}>
        <BasicButton
          bgColor={'gray.100'}
          color="gray.400"
          size={'lg'}
          width={'130px'}
          fontSize={'18px'}
          onClick={previousStep}
        >
          이전
        </BasicButton>
        <BasicButton
          bgColor={'main'}
          color="white"
          size={'lg'}
          width={'220px'}
          fontSize={'18px'}
          onClick={nextStep}
          styles={!isFilled && { isDisabled: true }}
        >
          송금하고 거래 시작하기
        </BasicButton>
      </Flex>
    </Flex>
  )
}

export default FinalCheckForm
