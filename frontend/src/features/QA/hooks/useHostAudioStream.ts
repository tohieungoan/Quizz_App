import { useState, useRef, useCallback, useEffect } from 'react'

interface UseHostAudioStreamProps {
  socket: WebSocket | null
  isConnected: boolean
}

export const useHostAudioStream = ({ socket, isConnected }: UseHostAudioStreamProps) => {
  const [isMicOn, setIsMicOn] = useState<boolean>(false)
  const [micError, setMicError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopMic = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err)
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
    setIsMicOn(false)
  }, [])

  const startMic = useCallback(async () => {
    setMicError(null)
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMicError('WebSocket is not connected.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      const options = { mimeType: 'audio/webm;codecs=opus' }
      let mediaRecorder: MediaRecorder

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mediaRecorder = new MediaRecorder(stream, options)
      } else {
        mediaRecorder = new MediaRecorder(stream)
      }

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1]
            if (base64Data) {
              socket.send(
                JSON.stringify({
                  type: 'AUDIO_STREAM',
                  t: 'AS',
                  chunk: base64Data,
                })
              )
            }
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(250) // Send slice every 250ms
      setIsMicOn(true)
    } catch (err: any) {
      console.error('Failed to access microphone:', err)
      setMicError(err.message || 'Could not access microphone.')
      setIsMicOn(false)
    }
  }, [socket])

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      stopMic()
    } else {
      startMic()
    }
  }, [isMicOn, startMic, stopMic])

  useEffect(() => {
    if (!isConnected && isMicOn) {
      stopMic()
    }
  }, [isConnected, isMicOn, stopMic])

  useEffect(() => {
    return () => {
      stopMic()
    }
  }, [stopMic])

  return {
    isMicOn,
    micError,
    toggleMic,
    startMic,
    stopMic,
  }
}
