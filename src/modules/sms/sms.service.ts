import axios, { AxiosInstance } from 'axios';
import { AppError } from '../../shared/utils/app-error';
import {
  SendSingleSMSDTO,
  SendBulkSameSMSDTO,
  SendBulkDifferentSMSDTO,
  SMSConfig,
  SMSResponse,
  SMSTemplateType,
} from './sms.dto';
import { SMSLog } from '../../models';
import { Op, fn, col } from 'sequelize';

export class SMSService {
  private config: SMSConfig;
  private axiosInstance: AxiosInstance;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      username: process.env.QUICKSEND_EMAIL || '',
      apiKey: process.env.QUICKSEND_API_KEY || '',
      senderID: process.env.QUICKSEND_SENDER_ID || 'QKSendDemo',
      apiUrl: process.env.QUICKSEND_API_URL || 'https://quicksend.lk/Client/api.php',
      enabled: process.env.SMS_ENABLED === 'true',
    };

    // Validate configuration
    if (this.config.enabled && (!this.config.username || !this.config.apiKey)) {
      console.warn('SMS service is enabled but credentials are missing');
    }

    // Create axios instance with Basic Auth
    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      auth: {
        username: this.config.username,
        password: this.config.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Check if SMS service is enabled and configured
   */
  private isConfigured(): boolean {
    return this.config.enabled && !!this.config.username && !!this.config.apiKey;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Phone number is required and must be a string' };
    }

    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Check if contains only digits and optional + at start
    if (!cleaned.match(/^\+?\d+$/)) {
      return { valid: false, error: 'Phone number can only contain digits, spaces, dashes, and optional + prefix' };
    }

    // Check length
    if (cleaned.length < 9 || cleaned.length > 15) {
      return { valid: false, error: `Invalid phone number length: ${cleaned.length} digits. Expected 9-15 digits` };
    }

    // Validate Sri Lankan number format
    const withoutPlus = cleaned.replace('+', '');
    
    // Check if it's a valid Sri Lankan number pattern
    if (withoutPlus.startsWith('94')) {
      // International format: should be 947xxxxxxxx (11 digits)
      if (withoutPlus.length !== 11) {
        return { valid: false, error: `Invalid Sri Lankan international format. Expected 947XXXXXXXX (11 digits), got ${withoutPlus.length} digits` };
      }
      // Check if starts with valid Sri Lankan mobile prefix
      const mobilePrefix = withoutPlus.substring(2, 3);
      if (!['7', '1', '2', '3', '4', '5', '6', '8'].includes(mobilePrefix)) {
        return { valid: false, error: `Invalid Sri Lankan mobile prefix: 94${mobilePrefix}. Must start with 947, 941, 942, etc.` };
      }
    } else if (withoutPlus.startsWith('0')) {
      // Local format: should be 0771234567 (10 digits)
      if (withoutPlus.length !== 10) {
        return { valid: false, error: `Invalid Sri Lankan local format. Expected 07XXXXXXXX (10 digits), got ${withoutPlus.length} digits` };
      }
    } else if (withoutPlus.length === 9) {
      // Without prefix: 771234567 (9 digits)
      const firstDigit = withoutPlus[0];
      if (!['7', '1', '2', '3', '4', '5', '6', '8'].includes(firstDigit)) {
        return { valid: false, error: `Invalid phone number. Must start with valid Sri Lankan prefix (7, 1, 2, etc.)` };
      }
    } else {
      return { valid: false, error: `Invalid phone number format. Use: 0771234567, 771234567, or 947XXXXXXXX` };
    }

    return { valid: true };
  }

  /**
   * Format phone number (ensure Sri Lankan international format for QuickSend)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with +94, remove the +
    if (cleaned.startsWith('+94')) {
      cleaned = cleaned.substring(1); // Remove + to get 947XXXXXXXX
    }
    
    // If it starts with 94, it's already good
    if (cleaned.startsWith('94')) {
      return cleaned;
    }
    
    // If it starts with 0, replace with 94
    if (cleaned.startsWith('0')) {
      return '94' + cleaned.substring(1);
    }
    
    // If it's just the number without prefix, assume it's local and add 94
    if (cleaned.length === 9 && cleaned.match(/^\d{9}$/)) {
      return '94' + cleaned;
    }
    
    // If it's 10 digits starting with 7, add 94
    if (cleaned.length === 10 && cleaned.startsWith('7')) {
      return '94' + cleaned;
    }
    
    // Return as is if already in correct format
    return cleaned;
  }

  /**
   * Send single SMS via POST (internally uses GET method which actually sends SMS)
   */
  async sendSingleSMS(
    data: SendSingleSMSDTO,
    referenceInfo?: {
      type?: SMSTemplateType;
      referenceId?: string;
      referenceType?: string;
    }
  ): Promise<SMSResponse> {
    // Check if we're in development mode and should mock SMS
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_SMS === 'true') {
      console.log('🧪 MOCK SMS: Simulating successful SMS send');
      console.log('To:', data.to, 'Message:', data.msg);
      
      // Log the mock SMS
      await this.logSMS({
        type: referenceInfo?.type || SMSTemplateType.CUSTOM,
        recipient: data.to,
        message: data.msg,
        status: 'SUCCESS',
        response: '{"status":"success","id":"MOCK-' + Date.now() + '"}',
        referenceId: referenceInfo?.referenceId,
        referenceType: referenceInfo?.referenceType,
      });
      
      return {
        success: true,
        message: 'Mock SMS sent successfully',
        data: { id: 'MOCK-' + Date.now() }
      };
    }

    // 1. Check if SMS service is configured
    if (!this.isConfigured()) {
      const error = 'SMS service not configured. Please check QUICKSEND_EMAIL and QUICKSEND_API_KEY in environment variables';
      console.error(error);
      return {
        success: false,
        message: error,
      };
    }

    try {
      // 2. Validate phone number
      const phoneValidation = this.validatePhoneNumber(data.to);
      if (!phoneValidation.valid) {
        console.error('Phone validation failed:', phoneValidation.error);
        await this.logSMS({
          type: referenceInfo?.type || SMSTemplateType.CUSTOM,
          recipient: data.to,
          message: data.msg,
          status: 'FAILED',
          response: `Validation Error: ${phoneValidation.error}`,
          referenceId: referenceInfo?.referenceId,
          referenceType: referenceInfo?.referenceType,
        });
        return {
          success: false,
          message: phoneValidation.error || 'Invalid phone number',
        };
      }

      // 3. Validate message
      if (!data.msg || data.msg.trim().length === 0) {
        const error = 'Message cannot be empty';
        console.error(error);
        return { success: false, message: error };
      }

      if (data.msg.length > 612) {
        const error = `Message too long: ${data.msg.length} characters. Maximum 612 characters allowed (4 SMS segments)`;
        console.error(error);
        return { success: false, message: error };
      }

      // 4. Validate sender ID
      const senderID = data.senderID || this.config.senderID;
      if (!senderID || senderID.length < 3 || senderID.length > 11) {
        const error = `Invalid sender ID: "${senderID}". Must be 3-11 characters`;
        console.error(error);
        return { success: false, message: error };
      }

      if (!/^[a-zA-Z0-9\s]+$/.test(senderID)) {
        const error = `Invalid sender ID: "${senderID}". Can only contain letters, numbers, and spaces`;
        console.error(error);
        return { success: false, message: error };
      }

      const formattedPhone = this.formatPhoneNumber(data.to);
      
      console.log('=================== SMS SEND (POST -> GET) ===================');
      console.log('Original phone:', data.to);
      console.log('Formatted phone:', formattedPhone);
      console.log('Sender ID:', data.senderID || this.config.senderID);
      console.log('Message:', data.msg);
      console.log('Message length:', data.msg.length);
      console.log('Reference info:', referenceInfo);
      console.log('Note: Using GET method internally as POST with Basic Auth does not actually send SMS');
      console.log('=============================================================');
      
      // Use GET method which actually sends SMS (POST with Basic Auth doesn't work)
      // 5. Prepare API request
      const params = {
        FUN: 'SEND_SINGLE',
        with_get: 'true',
        un: this.config.username,
        up: this.config.apiKey,
        senderID: senderID,
        msg: data.msg.trim(),
        to: formattedPhone,
      };

      // 6. Send API request with timeout and retry
      let response;
      try {
        response = await axios.get(this.config.apiUrl, { 
          params,
          timeout: 30000 // 30 second timeout
        });
      } catch (apiError: any) {
        const errorMsg = apiError.response?.data?.message || apiError.message || 'API request failed';
        console.error('QuickSend API Error:', {
          message: errorMsg,
          status: apiError.response?.status,
          data: apiError.response?.data,
        });

        await this.logSMS({
          type: referenceInfo?.type || SMSTemplateType.CUSTOM,
          recipient: formattedPhone,
          message: data.msg,
          status: 'FAILED',
          response: `API Error: ${errorMsg}`,
          referenceId: referenceInfo?.referenceId,
          referenceType: referenceInfo?.referenceType,
        });

        return {
          success: false,
          message: `SMS API Error: ${errorMsg}`,
        };
      }

      console.log('SMS API Response:', response.data);
      console.log('Message ID:', response.data.id || 'No ID returned (SMS may not have been sent!)');

      // 7. Validate response
      if (!response.data) {
        const error = 'Empty response from SMS API';
        console.error(error);
        return { success: false, message: error };
      }

      // QuickSend GET returns { status: 'success', id: '...' } when actually sent
      // If there's no ID, the SMS was NOT actually sent
      const isSuccess = (response.data.status === 'success' && response.data.id) || 
                        (response.data.success === true && response.data.id);

      // 8. Check for specific error responses
      if (response.data.error) {
        console.error('SMS API Error Response:', response.data.error);
        await this.logSMS({
          type: referenceInfo?.type || SMSTemplateType.CUSTOM,
          recipient: formattedPhone,
          message: data.msg,
          status: 'FAILED',
          response: JSON.stringify(response.data),
          referenceId: referenceInfo?.referenceId,
          referenceType: referenceInfo?.referenceType,
        });
        return {
          success: false,
          message: `SMS failed: ${response.data.error}`,
          data: response.data,
        };
      }

      const result: SMSResponse = {
        success: isSuccess,
        message: response.data.message || (isSuccess ? 'SMS sent successfully' : 'SMS sending failed - No message ID returned'),
        data: response.data,
      };

      // Warn if no message ID (means SMS wasn't actually sent)
      if (response.data.status === 'success' && !response.data.id) {
        console.error('⚠️ CRITICAL: SMS API returned success but NO MESSAGE ID!');
        console.error('This means the SMS was NOT actually sent.');
        console.error('Possible causes:');
        console.error('1. Using POST method instead of GET');
        console.error('2. Insufficient account balance');
        console.error('3. Unapproved sender ID');
        console.error('4. Invalid phone number');
        result.success = false;
        result.message = 'SMS sending failed - No message ID returned from API';
      }

      console.log('Parsed SMS Result:', result);
      console.log('Message ID:', response.data.id || 'NONE - SMS NOT SENT');

      // Log SMS with reference info
      await this.logSMS({
        type: referenceInfo?.type || SMSTemplateType.CUSTOM,
        recipient: formattedPhone,
        message: data.msg,
        status: result.success ? 'SUCCESS' : 'FAILED',
        response: JSON.stringify(response.data),
        referenceId: referenceInfo?.referenceId,
        referenceType: referenceInfo?.referenceType,
      });

      console.log('SMS logged successfully');

      return result;
    } catch (error: any) {
      // Handle unexpected errors
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      console.error('❌ Unexpected error sending SMS:', {
        message: errorMessage,
        name: error.name,
        code: error.code,
        phone: data.to,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      
      // Log failed SMS
      try {
        await this.logSMS({
          type: referenceInfo?.type || SMSTemplateType.CUSTOM,
          recipient: data.to,
          message: data.msg,
          status: 'FAILED',
          response: `Error: ${errorMessage}`,
          referenceId: referenceInfo?.referenceId,
          referenceType: referenceInfo?.referenceType,
        });
      } catch (logError) {
        console.error('Failed to log SMS error:', logError);
      }

      return {
        success: false,
        message: `Failed to send SMS: ${errorMessage}`,
      };
    }
  }

  /**
   * Send single SMS via GET
   */
  async sendSingleSMSViaGet(data: SendSingleSMSDTO): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      const error = 'SMS service not configured';
      console.error(error);
      return { success: false, message: error };
    }

    try {
      // Validate phone number
      const phoneValidation = this.validatePhoneNumber(data.to);
      if (!phoneValidation.valid) {
        console.error('Phone validation failed:', phoneValidation.error);
        return { success: false, message: phoneValidation.error || 'Invalid phone number' };
      }

      // Validate message
      if (!data.msg || data.msg.trim().length === 0) {
        return { success: false, message: 'Message cannot be empty' };
      }

      const formattedPhone = this.formatPhoneNumber(data.to);
      
      console.log('=================== SMS SEND VIA GET ===================');
      console.log('Original phone:', data.to);
      console.log('Formatted phone:', formattedPhone);
      console.log('Message:', data.msg);
      console.log('========================================================');
      
      const params = {
        FUN: 'SEND_SINGLE',
        with_get: 'true',
        un: this.config.username,
        up: this.config.apiKey,
        senderID: data.senderID || this.config.senderID,
        msg: data.msg,
        to: formattedPhone,
      };

      const response = await axios.get(this.config.apiUrl, { params });

      console.log('SMS API Response (GET):', response.data);
      console.log('Has Message ID:', !!response.data.id);
      if (response.data.id) {
        console.log('Message ID:', response.data.id);
      }

      // QuickSend GET returns { status: 'success', id: '...' } when actually sent
      const isSuccess = (response.data.status === 'success' && response.data.id) || 
                        response.data.success === true || 
                        response.status === 200;

      const result: SMSResponse = {
        success: isSuccess,
        message: response.data.message || (isSuccess ? 'SMS sent successfully' : 'SMS sending failed'),
        data: response.data,
      };

      // Log SMS
      await this.logSMS({
        type: SMSTemplateType.CUSTOM,
        recipient: formattedPhone,
        message: data.msg,
        status: result.success ? 'SUCCESS' : 'FAILED',
        response: JSON.stringify(response.data),
      });

      return result;
    } catch (error: any) {
      console.error('Error sending SMS via GET:', error.message);
      
      await this.logSMS({
        type: SMSTemplateType.CUSTOM,
        recipient: data.to,
        message: data.msg,
        status: 'FAILED',
        response: error.message,
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Send bulk SMS with same message (sends individually using GET method)
   */
  async sendBulkSameSMS(data: SendBulkSameSMSDTO): Promise<SMSResponse> {
    // 1. Check if SMS service is configured
    if (!this.isConfigured()) {
      const error = 'SMS service not configured';
      console.error(error);
      return { success: false, message: error };
    }

    try {
      // 2. Validate recipients count
      if (!data.to || data.to.length === 0) {
        return { success: false, message: 'No recipients provided' };
      }

      if (data.to.length > 1000) {
        return { success: false, message: `Too many recipients: ${data.to.length}. Maximum 1000 allowed per request` };
      }

      // 3. Validate message
      if (!data.msg || data.msg.trim().length === 0) {
        return { success: false, message: 'Message cannot be empty' };
      }

      // 4. Validate all phone numbers first
      const invalidPhones: string[] = [];
      const validPhones: string[] = [];
      
      for (const phone of data.to) {
        const validation = this.validatePhoneNumber(phone);
        if (!validation.valid) {
          invalidPhones.push(`${phone}: ${validation.error}`);
        } else {
          validPhones.push(phone);
        }
      }

      if (invalidPhones.length > 0) {
        console.error('Invalid phone numbers found:', invalidPhones);
        return {
          success: false,
          message: `${invalidPhones.length} invalid phone number(s) found`,
          data: { invalidPhones: invalidPhones.slice(0, 10) } // Return first 10 invalid numbers
        };
      }

      const formattedPhones = validPhones.map(phone => this.formatPhoneNumber(phone));

      console.log('=================== BULK SAME SMS ===================');
      console.log('Recipients:', formattedPhones.length);
      console.log('Message:', data.msg);
      console.log('Note: Sending individually using GET method (POST bulk doesn\'t work)');
      console.log('====================================================');

      // Send SMS to each recipient individually using GET method
      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < formattedPhones.length; i++) {
        const phone = formattedPhones[i];
        try {
          const params = {
            FUN: 'SEND_SINGLE',
            with_get: 'true',
            un: this.config.username,
            up: this.config.apiKey,
            senderID: this.config.senderID,
            msg: data.msg,
            to: phone,
          };

          const response = await axios.get(this.config.apiUrl, { params });
          
          const isSuccess = (response.data.status === 'success' && response.data.id);
          
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }

          results.push({
            phone,
            success: isSuccess,
            messageId: response.data.id,
            response: response.data
          });

          // Log individual SMS
          await this.logSMS({
            type: SMSTemplateType.CUSTOM,
            recipient: phone,
            message: data.msg,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            response: JSON.stringify(response.data),
          });

          // Small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          failCount++;
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
          console.error(`❌ Failed to send SMS to ${phone}:`, errorMsg);
          errors.push(`${phone}: ${errorMsg}`);
          
          results.push({
            phone,
            success: false,
            error: errorMsg
          });

          try {
            await this.logSMS({
              type: SMSTemplateType.CUSTOM,
              recipient: phone,
              message: data.msg,
              status: 'FAILED',
              response: errorMsg,
            });
          } catch (logError) {
            console.error('Failed to log SMS error:', logError);
          }
        }
      }

      const result: SMSResponse = {
        success: successCount > 0,
        message: `Bulk SMS: ${successCount} sent, ${failCount} failed out of ${formattedPhones.length} total`,
        data: {
          total: formattedPhones.length,
          success: successCount,
          failed: failCount,
          results,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Include first 10 errors
        },
      };

      if (failCount > 0) {
        console.warn(`⚠️ Bulk SMS completed with ${failCount} failure(s)`);
      }

      console.log('Bulk Same SMS Results:', result);
      return result;
    } catch (error: any) {
      console.error('Error sending bulk SMS:', error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send bulk SMS',
      };
    }
  }

  /**
   * Send bulk SMS with different messages (sends individually using GET method)
   */
  async sendBulkDifferentSMS(data: SendBulkDifferentSMSDTO): Promise<SMSResponse> {
    // 1. Check if SMS service is configured
    if (!this.isConfigured()) {
      const error = 'SMS service not configured';
      console.error(error);
      return { success: false, message: error };
    }

    try {
      // 2. Validate message list
      if (!data.msgList || data.msgList.length === 0) {
        return { success: false, message: 'No messages provided' };
      }

      if (data.msgList.length > 500) {
        return { success: false, message: `Too many messages: ${data.msgList.length}. Maximum 500 allowed per request` };
      }

      // 3. Validate all entries first
      const validationErrors: string[] = [];
      const validMsgList: Array<{ to: string; msg: string }> = [];

      for (let i = 0; i < data.msgList.length; i++) {
        const item = data.msgList[i];
        
        // Validate phone
        const phoneValidation = this.validatePhoneNumber(item.to);
        if (!phoneValidation.valid) {
          validationErrors.push(`Entry ${i + 1}: ${phoneValidation.error}`);
          continue;
        }

        // Validate message
        if (!item.msg || item.msg.trim().length === 0) {
          validationErrors.push(`Entry ${i + 1}: Message cannot be empty`);
          continue;
        }

        if (item.msg.length > 612) {
          validationErrors.push(`Entry ${i + 1}: Message too long (${item.msg.length} chars, max 612)`);
          continue;
        }

        validMsgList.push(item);
      }

      if (validationErrors.length > 0) {
        console.error('Validation errors in bulk different SMS:', validationErrors);
        return {
          success: false,
          message: `${validationErrors.length} validation error(s) found`,
          data: { errors: validationErrors.slice(0, 10) } // Return first 10 errors
        };
      }

      const formattedMsgList = validMsgList.map(item => ({
        to: this.formatPhoneNumber(item.to),
        msg: item.msg.trim(),
      }));

      console.log('=================== BULK DIFFERENT SMS ===================');
      console.log('Recipients:', formattedMsgList.length);
      console.log('Note: Sending individually using GET method (POST bulk doesn\'t work)');
      console.log('=========================================================');

      // Send SMS to each recipient individually using GET method
      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < formattedMsgList.length; i++) {
        const item = formattedMsgList[i];
        try {
          const params = {
            FUN: 'SEND_SINGLE',
            with_get: 'true',
            un: this.config.username,
            up: this.config.apiKey,
            senderID: this.config.senderID,
            msg: item.msg,
            to: item.to,
          };

          const response = await axios.get(this.config.apiUrl, { params });
          
          const isSuccess = (response.data.status === 'success' && response.data.id);
          
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }

          results.push({
            phone: item.to,
            message: item.msg,
            success: isSuccess,
            messageId: response.data.id,
            response: response.data
          });

          // Log individual SMS
          await this.logSMS({
            type: SMSTemplateType.CUSTOM,
            recipient: item.to,
            message: item.msg,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            response: JSON.stringify(response.data),
          });

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          failCount++;
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
          console.error(`❌ Failed to send SMS ${i + 1}/${formattedMsgList.length} to ${item.to}:`, errorMsg);
          errors.push(`${item.to}: ${errorMsg}`);
          
          results.push({
            phone: item.to,
            message: item.msg,
            success: false,
            error: errorMsg
          });

          try {
            await this.logSMS({
              type: SMSTemplateType.CUSTOM,
              recipient: item.to,
              message: item.msg,
              status: 'FAILED',
              response: errorMsg,
            });
          } catch (logError) {
            console.error('Failed to log SMS error:', logError);
          }
        }
      }

      const result: SMSResponse = {
        success: successCount > 0,
        message: `Bulk different SMS: ${successCount} sent, ${failCount} failed out of ${formattedMsgList.length} total`,
        data: {
          total: formattedMsgList.length,
          success: successCount,
          failed: failCount,
          results,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Include first 10 errors
        },
      };

      if (failCount > 0) {
        console.warn(`⚠️ Bulk different SMS completed with ${failCount} failure(s)`);
      }

      console.log('Bulk Different SMS Results:', result);
      return result;
    } catch (error: any) {
      console.error('Error sending bulk different SMS:', error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send bulk different SMS',
      };
    }
  }

  /**
   * Check account balance
   */
  async checkBalance(): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      throw new AppError(400, 'SMS service not configured');
    }

    try {
      console.log('=== Attempting QuickSend Balance Check ===');
      
      // Scrape balance from the topup page since API doesn't return it
      const topupUrl = `https://quicksend.lk/Client/topup.php?email=${encodeURIComponent(this.config.username)}`;
      console.log('Fetching balance from:', topupUrl);
      
      const response = await axios.get(topupUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = response.data as string;
      console.log('Page fetched, length:', html.length);
      
      // Log section around "Current Balance" for debugging
      const balanceIndex = html.indexOf('Current Balance');
      if (balanceIndex > -1) {
        console.log('HTML around Current Balance:', html.substring(balanceIndex, balanceIndex + 200));
      } else {
        console.log('Could not find "Current Balance" in HTML');
        // Try to find any USD mention
        const USDIndex = html.indexOf('USD');
        if (USDIndex > -1) {
          console.log('HTML around USD:', html.substring(Math.max(0, USDIndex - 100), USDIndex + 50));
        }
      }

      // Parse balance from HTML - looking for "Current Balance: XX.XX USD"
      let balance: number | undefined;
      
      // Try multiple patterns to find the balance
      const patterns = [
        // Match patterns with HTML tags between text
        /Current\s*Balance[:\s]*(?:<[^>]*>)*\s*([\d,.]+)\s*(?:<[^>]*>)*\s*USD/i,
        /Current\s*Balance[:\s]*([\d,.]+)\s*USD/i,
        // Match balance value before USD
        />\s*([\d]+\.[\d]+)\s*USD\s*</i,
        /:\s*([\d]+\.[\d]+)\s*USD/i,
        // Generic number before USD
        /([\d]+\.[\d]{2})\s*USD/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          // Remove commas and parse as float
          balance = parseFloat(match[1].replace(/,/g, ''));
          console.log('Found balance:', balance, 'using pattern:', pattern.toString());
          break;
        }
      }

      if (balance !== undefined && !isNaN(balance)) {
        return {
          success: true,
          message: 'Balance retrieved successfully',
          balance: balance,
          credits: balance,
        };
      } else {
        console.log('Could not parse balance from page');
        return {
          success: true,
          message: 'Connected to QuickSend - check portal for balance',
          balance: undefined,
          credits: undefined,
        };
      }
    } catch (error: any) {
      console.error('Error checking balance:', error.message);
      console.error('Error details:', error.response?.data);
      throw new AppError(500, error.response?.data?.message || 'Failed to check balance');
    }
  }

  /**
   * Send sale confirmation SMS
   */
  async sendSaleConfirmationSMS(
    customerPhone: string,
    customerName: string,
    saleNumber: string,
    totalAmount: number,
    locationName: string
  ): Promise<SMSResponse> {
    console.log('=== sendSaleConfirmationSMS called ===');
    console.log('Customer Phone:', customerPhone);
    console.log('Customer Name:', customerName);
    console.log('Sale Number:', saleNumber);
    console.log('Total Amount:', totalAmount);
    console.log('Location Name:', locationName);

    const message = `Dear ${customerName}, Thank you for your purchase! Sale #${saleNumber} - Total: Rs. ${totalAmount.toFixed(2)}. ${locationName}. For support, contact us.`;
    
    console.log('SMS Message:', message);

    // Use GET method instead of POST for actual SMS delivery
    const result = await this.sendSingleSMSViaGet(
      {
        to: customerPhone,
        msg: message,
      }
    );

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.SALE_CONFIRMATION,
          referenceId: saleNumber,
          referenceType: 'SALE',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    console.log('SMS send result:', result);

    return result;
  }

  /**
   * Send payment received SMS
   */
  async sendPaymentReceivedSMS(
    customerPhone: string,
    customerName: string,
    amount: number,
    paymentMethod: string,
    reference?: string
  ): Promise<SMSResponse> {
    let message = `Dear ${customerName}, Payment of Rs. ${amount.toFixed(2)} received via ${paymentMethod}.`;
    if (reference) {
      message += ` Ref: ${reference}.`;
    }
    message += ' Thank you!';
    
    const result = await this.sendSingleSMS(
      {
        to: customerPhone,
        msg: message,
      },
      {
        type: SMSTemplateType.PAYMENT_RECEIVED,
        referenceId: reference,
        referenceType: 'PAYMENT',
      }
    );

    return result;
  }

  /**
   * Send product return received SMS
   */
  async sendProductReturnReceivedSMS(
    customerPhone: string,
    customerName: string,
    returnNumber: string,
    productName: string,
    locationName: string
  ): Promise<SMSResponse> {
    const message = `Dear ${customerName}, Your return request ${returnNumber} for ${productName} has been received at ${locationName}. We will inspect and update you soon.`;
    
    const result = await this.sendSingleSMSViaGet({
      to: customerPhone,
      msg: message,
    });

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.CUSTOM,
          referenceId: returnNumber,
          referenceType: 'PRODUCT_RETURN',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    return result;
  }

  /**
   * Send product return approved SMS
   */
  async sendProductReturnApprovedSMS(
    customerPhone: string,
    customerName: string,
    returnNumber: string,
    productName: string,
    resolutionType: string,
    locationName: string
  ): Promise<SMSResponse> {
    let resolutionText = '';
    switch (resolutionType) {
      case 'REFUND_PROCESSED':
        resolutionText = 'Refund will be processed';
        break;
      case 'RESTOCKED_BRANCH':
        resolutionText = 'Product will be restocked';
        break;
      case 'RETURNED_SUPPLIER':
        resolutionText = 'Product will be returned to supplier';
        break;
      case 'TRANSFERRED_WAREHOUSE':
        resolutionText = 'Product will be transferred to warehouse';
        break;
      case 'SCRAPPED':
        resolutionText = 'Product will be scrapped';
        break;
      default:
        resolutionText = 'Your return has been approved';
    }

    const message = `Dear ${customerName}, Return ${returnNumber} for ${productName} has been approved. ${resolutionText}. ${locationName}`;
    
    const result = await this.sendSingleSMSViaGet({
      to: customerPhone,
      msg: message,
    });

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.CUSTOM,
          referenceId: returnNumber,
          referenceType: 'PRODUCT_RETURN',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    return result;
  }

  /**
   * Send product return completed SMS
   */
  async sendProductReturnCompletedSMS(
    customerPhone: string,
    customerName: string,
    returnNumber: string,
    productName: string,
    resolutionType: string,
    locationName: string,
    refundAmount?: number
  ): Promise<SMSResponse> {
    let resolutionText = '';
    switch (resolutionType) {
      case 'REFUND_PROCESSED':
        resolutionText = refundAmount 
          ? `Refund of Rs. ${refundAmount.toFixed(2)} has been processed` 
          : 'Refund has been processed';
        break;
      case 'RESTOCKED_BRANCH':
        resolutionText = 'Product has been restocked';
        break;
      case 'RETURNED_SUPPLIER':
        resolutionText = 'Product has been returned to supplier';
        break;
      case 'TRANSFERRED_WAREHOUSE':
        resolutionText = 'Product has been transferred';
        break;
      case 'SCRAPPED':
        resolutionText = 'Product has been scrapped';
        break;
      default:
        resolutionText = 'Your return has been processed';
    }

    const message = `Dear ${customerName}, Return ${returnNumber} for ${productName} is completed. ${resolutionText}. Thank you! ${locationName}`;
    
    const result = await this.sendSingleSMSViaGet({
      to: customerPhone,
      msg: message,
    });

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.CUSTOM,
          referenceId: returnNumber,
          referenceType: 'PRODUCT_RETURN',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    return result;
  }

  /**
   * Send product return rejected SMS
   */
  async sendProductReturnRejectedSMS(
    customerPhone: string,
    customerName: string,
    returnNumber: string,
    productName: string,
    rejectionReason: string,
    locationName: string
  ): Promise<SMSResponse> {
    const message = `Dear ${customerName}, Return ${returnNumber} for ${productName} has been rejected. Reason: ${rejectionReason}. Please contact ${locationName} for details.`;
    
    const result = await this.sendSingleSMSViaGet({
      to: customerPhone,
      msg: message,
    });

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.CUSTOM,
          referenceId: returnNumber,
          referenceType: 'PRODUCT_RETURN',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    return result;
  }

  /**
   * Send product return inspection completed SMS
   */
  async sendProductReturnInspectedSMS(
    customerPhone: string,
    customerName: string,
    returnNumber: string,
    productName: string,
    newStatus: string,
    locationName: string
  ): Promise<SMSResponse> {
    let statusText = '';
    if (newStatus === 'PENDING_APPROVAL') {
      statusText = 'has been inspected and is pending approval';
    } else if (newStatus === 'REJECTED') {
      statusText = 'has been inspected and rejected';
    } else {
      statusText = 'is being inspected';
    }

    const message = `Dear ${customerName}, Return ${returnNumber} for ${productName} ${statusText}. We will update you soon. ${locationName}`;
    
    const result = await this.sendSingleSMSViaGet({
      to: customerPhone,
      msg: message,
    });

    // Update log with reference info after sending
    if (result.success) {
      try {
        await SMSLog.update({
          type: SMSTemplateType.CUSTOM,
          referenceId: returnNumber,
          referenceType: 'PRODUCT_RETURN',
        }, {
          where: {
            recipient: this.formatPhoneNumber(customerPhone),
            message: message,
          }
        });
      } catch (updateError) {
        console.error('Failed to update SMS log with reference:', updateError);
      }
    }

    return result;
  }

  /**
   * Log SMS to database
   */
  private async logSMS(data: {
    type: SMSTemplateType;
    recipient: string;
    message: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    response?: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<void> {
    try {
      await SMSLog.create({
        type: data.type,
        recipient: data.recipient,
        message: data.message,
        status: data.status,
        response: data.response,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        sentAt: new Date(),
      });
    } catch (error) {
      console.error('Error logging SMS:', error);
    }
  }

  /**
   * Get SMS logs
   */
  async getSMSLogs(filters?: {
    type?: SMSTemplateType;
    status?: string;
    startDate?: string;
    endDate?: string;
    recipient?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.recipient) {
      where.recipient = {
        [Op.iLike]: `%${filters.recipient}%`,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) {
        where.sentAt[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.sentAt[Op.lte] = new Date(filters.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      SMSLog.findAll({
        where,
        order: [['sentAt', 'DESC']],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      }),
      SMSLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => log.toJSON()),
      pagination: {
        total,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      },
    };
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) {
        where.sentAt[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.sentAt[Op.lte] = new Date(filters.endDate);
      }
    }

    const [total, successful, failed, byType] = await Promise.all([
      SMSLog.count({ where }),
      SMSLog.count({ where: { ...where, status: 'SUCCESS' } }),
      SMSLog.count({ where: { ...where, status: 'FAILED' } }),
      SMSLog.findAll({
        where,
        attributes: [
          'type',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byType: (byType as any[]).map((item: any) => ({
        type: item.type,
        count: parseInt(item.count as string),
      })),
    };
  }
}

