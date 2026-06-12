'use client';

/**
 * MessageInput Component
 *
 * Text input for sending messages with:
 * - 2000 character limit
 * - Real-time PII detection
 * - Warning UI before sending PII in masked conversations
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10.6
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, Mail, Phone, Link2 } from 'lucide-react';
import { detectPII, PIIDetectionResult } from '@/lib/privacy/pii-detection';

interface MessageInputProps {
  onSend: (content: string, piiWarningShown?: boolean) => Promise<void>;
  disabled?: boolean;
  conversationStage: 'masked' | 'revealed';
}

export function MessageInput({ onSend, disabled, conversationStage }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [piiDetection, setPiiDetection] = useState<PIIDetectionResult | null>(null);
  const [showPiiWarning, setShowPiiWarning] = useState(false);
  const [piiWarningMessage, setPiiWarningMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charLimit = 2000;
  const charCount = content.length;
  const charRemaining = charLimit - charCount;

  // Detect PII as user types (only in masked stage)
  const handleContentChange = (value: string) => {
    setContent(value);
    setSendError(null);

    if (conversationStage === 'masked' && value.trim().length > 0) {
      const detection = detectPII(value);
      setPiiDetection(detection);
    } else {
      setPiiDetection(null);
    }
  };

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    // Check if exceeds limit
    if (content.length > charLimit) {
      return;
    }

    try {
      setSending(true);
      setSendError(null);
      await onSend(content, false);

      // Clear input on success
      setContent('');
      setPiiDetection(null);
      textareaRef.current?.focus();
    } catch (err) {
      // Check if error is PII detection warning
      if (err instanceof Error) {
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.type === 'PII_DETECTED') {
            // Show PII warning dialog
            setPiiWarningMessage(errorData.message);
            setShowPiiWarning(true);
            return;
          }
          setSendError(
            typeof errorData.message === 'string'
              ? errorData.message
              : 'Message could not be sent. Please try again.'
          );
          return;
        } catch {
          setSendError(err.message || 'Message could not be sent. Please try again.');
          return;
        }
      }
      setSendError('Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendWithPII = async () => {
    setShowPiiWarning(false);
    try {
      setSending(true);
      setSendError(null);
      await onSend(content, true); // Force allow despite PII

      // Clear input on success
      setContent('');
      setPiiDetection(null);
      textareaRef.current?.focus();
    } catch (err) {
      setSendError(
        err instanceof Error && err.message
          ? err.message
          : 'Message could not be sent. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* PII Detection Warning (inline) */}
        {piiDetection?.hasPII && conversationStage === 'masked' && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Personal information detected
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="mb-2 text-sm">Your message contains:</p>
              <div className="flex flex-wrap gap-1">
                {piiDetection.containsEmail && (
                  <Badge
                    variant="outline"
                    className="border-amber-600 text-amber-900 dark:text-amber-100"
                  >
                    <Mail className="mr-1 h-3 w-3" />
                    Email address
                  </Badge>
                )}
                {piiDetection.containsPhone && (
                  <Badge
                    variant="outline"
                    className="border-amber-600 text-amber-900 dark:text-amber-100"
                  >
                    <Phone className="mr-1 h-3 w-3" />
                    Phone number
                  </Badge>
                )}
                {piiDetection.containsUrl && (
                  <Badge
                    variant="outline"
                    className="border-amber-600 text-amber-900 dark:text-amber-100"
                  >
                    <Link2 className="mr-1 h-3 w-3" />
                    Link
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs">
                Consider waiting until identities are revealed before sharing contact information.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {sendError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Message not sent</AlertTitle>
            <AlertDescription>{sendError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Text Input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              conversationStage === 'masked'
                ? 'Type your message... (Avoid sharing contact info until identities are revealed)'
                : 'Type your message...'
            }
            className="min-h-[80px] pr-16 resize-none"
            disabled={disabled || sending}
            maxLength={charLimit}
          />

          {/* Send Button (floating) */}
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sending || disabled || charCount > charLimit}
            size="icon"
            aria-label={sending ? 'Sending message' : 'Send message'}
            className="absolute bottom-2 right-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Character Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {conversationStage === 'masked' && 'Masked thread: identity protected'}
            {conversationStage === 'revealed' && 'Revealed thread: identities visible'}
          </span>
          <span className={charRemaining < 100 ? 'text-amber-600' : ''}>
            {charCount}/{charLimit}
          </span>
        </div>
      </div>

      {/* PII Warning Dialog */}
      <AlertDialog open={showPiiWarning} onOpenChange={setShowPiiWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Personal information detected
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{piiWarningMessage}</p>
                <p>
                  Sharing personal contact information before revealing identities may compromise
                  your privacy. The other person can see your information without reciprocating.
                </p>
                <p className="font-semibold">Are you sure you want to send this message?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSending(false)}>Edit message</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendWithPII}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Send anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
