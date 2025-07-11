import * as yup from 'yup';


export const loginSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Gecerli bir e-posta adresi giriniz')
    .lowercase()
    .trim(),
  password: yup
    .string()
    .required('Sifre gereklidir')
    .min(6, 'Sifre en az 6 karakter olmalidir')
});


export const registerSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Gecerli bir e-posta adresi giriniz')
    .lowercase()
    .trim(),
  username: yup
    .string()
    .required('Kullanici adi gereklidir')
    .min(3, 'Kullanici adi en az 3 karakter olmalidir')
    .max(20, 'Kullanici adi en fazla 20 karakter olabilir')
    .trim(),
  password: yup
    .string()
    .required('Sifre gereklidir')
    .min(6, 'Sifre en az 6 karakter olmalidir')
    .max(128, 'Sifre en fazla 128 karakter olabilir'),
  characterClass: yup
    .object({
      id: yup.string().required(),
      name: yup.string().required(),
      icon: yup.string().required(),
      color: yup.string().required(),
      description: yup.string().required(),
      abilities: yup.array().of(yup.string()).required()
    })
    .required('Karakter sinifi secimi gereklidir')
});


export const frontendRegisterSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gerekli')
    .email('Gecerli bir e-posta adresi girin')
    .trim(),
  username: yup
    .string()
    .required('Kullanici adi gerekli')
    .min(3, 'Kullanici adi en az 3 karakter olmali')
    .max(20, 'Kullanici adi en fazla 20 karakter olabilir')
    .trim(),
  password: yup
    .string()
    .required('Sifre gerekli')
    .min(6, 'Sifre en az 6 karakter olmali'),
  confirmPassword: yup
    .string()
    .required('Sifre tekrari gerekli')
    .test('passwords-match', 'Sifreler eslesmeli', function(value) {
      return this.parent.password === value;
    }),
  characterClass: yup
    .object()
    .nullable()
    .required('Karakter sinifi secmelisiniz')
});


export const profileUpdateSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Kullanici adi en az 3 karakter olmalidir')
    .max(20, 'Kullanici adi en fazla 20 karakter olabilir')
    .trim(),
  bio: yup
    .string()
    .max(500, 'Bio en fazla 500 karakter olabilir')
    .trim()
});


export const passwordChangeSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Mevcut sifre gereklidir'),
  newPassword: yup
    .string()
    .required('Yeni sifre gereklidir')
    .min(6, 'Yeni sifre en az 6 karakter olmalidir')
    .max(128, 'Yeni sifre en fazla 128 karakter olabilir'),
  confirmNewPassword: yup
    .string()
    .required('Yeni sifre tekrari gereklidir')
    .test('passwords-match', 'Yeni sifreler eslesmeli', function(value) {
      return this.parent.newPassword === value;
    })
});