import { checkSchema } from 'express-validator';

export default checkSchema({
  name: {
    trim: true,
    errorMessage: 'name is required',
    notEmpty: true,
    isLength: {
      options: { min: 8, max: 100 },
      errorMessage: 'Tenant name should be at least 8 chars & at most 100 chars'
    }
  },
  address: {
    trim: true,
    errorMessage: 'address is required',
    notEmpty: true,
    isLength: {
      options: { min: 8, max: 255 },
      errorMessage:
        'Tenant address should be at least 8 chars & at most 255 chars'
    }
  }
});
