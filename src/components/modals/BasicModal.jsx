import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Flex,
  Text,
  Spacer,
} from '@chakra-ui/react'
import BasicButton from '../buttons/BasicButton'

const BasicModal = (props) => {
  const {
    isOpen,
    onClose,
    children,
    title,
    buttonName,
    onClick,
    buttonColor,
    buttonTextColor,
  } = props

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'md'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          alignSelf={'center'}
          pt={10}
          fontFamily={'Pretendard-Bold'}
        >
          {title}
        </ModalHeader>

        <ModalBody>{children}</ModalBody>

        <ModalFooter>
          <Flex width={'100%'}>
            <BasicButton
              bgColor="gray.100"
              color="gray.400"
              size="sm"
              width={'90%'}
              height={50}
              fontSize={18}
              onClick={onClose}
            >
              닫기
            </BasicButton>
          </Flex>
          <BasicButton
            bgColor={buttonColor}
            color={buttonTextColor}
            size="sm"
            width={'130%'}
            height={50}
            fontSize={18}
            onClick={onClick}
          >
            {buttonName}
          </BasicButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default BasicModal
