import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Stack, TextField } from '@mui/material';
import {
  Button,
  formatDateMMDDYYYY,
  SelectInput,
  SSNInput,
  When,
} from '@verifiedinc-public/shared-ui-elements';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { AddressCredential, OneClickCredentials } from '@/types/OneClick.types';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import {
  SignupOneClickForm,
  signupOneClickFormSchema,
} from './signup-one-click.schema';

interface SignupOneClickFormStepProps {
  onSubmit: (data: SignupOneClickForm) => void;
  credentials: OneClickCredentials | null;
}
// Form to fill the user information
// It will fill the user information with the data from the one click credentials
// If the user doesn't have the credentials, it will show an empty form
export default function SignupOneClickFormStep({
  credentials,
  onSubmit,
}: SignupOneClickFormStepProps): ReactNode {
  // React hook form to handle the form state
  const {
    register,
    trigger,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<SignupOneClickForm>({
    resolver: zodResolver(signupOneClickFormSchema),
  });

  const [addresses, setAddresses] = useState<AddressCredential[]>([]);
  // This state will hold the index of the selected address
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(
    null,
  );

  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  interface AddressOption {
    id: string;
    label: string;
  }

  const addressesOptions = useMemo(() => {
    let options: { id: string; label: string }[] = [];

    options = addresses.map((address, index) => ({
      id: `${index}`,
      label: [address.line1, address.city, address.state, address.zipCode]
        .filter(Boolean) // Remove undefined or falsy values
        .join(', '),
    }));

    options.push({
      id: '-1',
      label: '+ Add New Address',
    });

    return options;
  }, [addresses]);

  // Fill the default value of the Birthday field
  // This is one way of handling uncontrolled components with react hook form
  useEffect(() => {
    if (credentials?.birthDate) {
      setValue('dob', new Date(formatDateMMDDYYYY(credentials.birthDate)));
    }

    if (credentials?.address) {
      updateAddresses();
    }
  }, [credentials?.birthDate, credentials?.address]);

  useEffect(() => {
    if (addressesOptions.length > 0) {
      handleSelectAddressOption(addressesOptions[0]);
    }
  }, [addressesOptions]);

  const updateAddresses = () => {
    let addresses: AddressCredential[] = [];
    if (credentials && Array.isArray(credentials.address)) {
      addresses = credentials.address;
    } else if (credentials?.address) {
      addresses = [credentials.address as AddressCredential];
    }

    setAddresses(addresses);
  };

  // Function to handle the selected address input
  // It will set the selected address index and fill the form fields with the address data
  // If the user selects the add new address option, it will clear the form fields
  const handleSelectAddressOption = (
    option: { label: string; id: string } | null,
  ) => {
    const isNewAddress = option?.id === '-1';
    setIsAddingNewAddress(isNewAddress);
    setSelectedAddress(option ?? null);

    // Get the address data from the credentials or create an empty object
    const addressCredentials =
      !isNewAddress && !!option ? addresses[+option.id] : {};

    // Update the form fields with the address data
    updateAddressFields(addressCredentials);
  };

  const updateAddressFields = (address: any) => {
    Object.entries({
      addressLine1: address?.line1 || '',
      city: address?.city || '',
      state: address?.state || '',
      zip: address?.zipCode || '',
      country: address?.country || '',
    }).forEach(([field, value]) => {
      setValue(field as keyof SignupOneClickForm, value as string);
      // Update the error state of the field
      // If the value is empty, it will not trigger the validation to avoid showing the error messages
      if (value) {
        trigger(field as keyof SignupOneClickForm);
      }
    });
  };

  const getCommonFormProps = (fieldName: keyof SignupOneClickForm) => {
    return {
      ...register(fieldName),
      error: !!errors[fieldName],
      helperText: errors[fieldName]?.message?.toString(),
      size: 'small' as 'small',
    };
  };

  // If the user doesn't select an address and tries to submit the form
  // It will show an error message bellow the address select input
  // Necessary because the select input is not really part of the form, it's used to control the address fields
  const renderAddressSelectErrorMessage = () => {
    if (errors.addressLine1 && selectedAddress === null) {
      return {
        helperText: `Please select an address or add a new one`,
        error: true,
      };
    }
  };

  return (
    <When value={!!addressesOptions.length}>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} pb={4}>
        <Stack spacing={1}>
          <TextField
            label='First Name'
            {...getCommonFormProps('firstName')}
            defaultValue={credentials?.fullName?.firstName}
          />

          <TextField
            label='Last Name'
            {...getCommonFormProps('lastName')}
            defaultValue={credentials?.fullName?.lastName}
          />

          <DatePicker
            label='Birthday'
            slotProps={{
              textField: {
                error: !!errors.dob,
                helperText: errors.dob?.message?.toString(),
                size: 'small',
              },
            }}
            defaultValue={
              credentials?.birthDate
                ? dayjs(formatDateMMDDYYYY(credentials?.birthDate))
                : null
            }
            onChange={(date) => {
              if (date) setValue('dob', date.toDate());
            }}
          />
          <Controller
            control={control}
            name='ssn'
            defaultValue={credentials?.ssn}
            render={({ field: { onChange, value } }) => (
              <SSNInput
                onChange={onChange}
                value={value}
                label='Social Security Number'
                error={!!errors.ssn}
                helperText={errors.ssn?.message?.toString()}
              />
            )}
          />

          <SelectInput
            InputProps={{
              label: 'Select the address',
              ...renderAddressSelectErrorMessage(),
            }}
            value={selectedAddress}
            disableClearable={true}
            options={addressesOptions}
            onChange={handleSelectAddressOption}
          />

          <When value={selectedAddress !== null}>
            <TextField
              label='Address Line 1'
              {...getCommonFormProps('addressLine1')}
            />

            <TextField label='City' {...getCommonFormProps('city')} />
            <TextField label='State' {...getCommonFormProps('state')} />
            <TextField label='ZIP Code' {...getCommonFormProps('zip')} />
            <TextField label='Country' {...getCommonFormProps('country')} />
          </When>

          <Button type='submit' variant='contained' size='large'>
            Sign up
          </Button>
        </Stack>
      </Box>
    </When>
  );
}
