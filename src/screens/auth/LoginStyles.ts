import { StyleSheet } from "react-native";

export const LoginStyles = StyleSheet.create({ 
    container: {
    flex: 1
  },
  subContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  homebg: {
    height: 110,
    width: 110,
    borderRadius: 24,
    marginBottom: 16,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3E8FF',
    paddingHorizontal: 15,
    marginBottom: 18
  },
  inputIcon: {
    marginRight: 10,
  },
  lottie: {
    height: 100,
    width: 100
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#101828',
    marginTop: 18
  },
  subtitle: {
    fontSize: 16,
    color: '#667085',
    marginTop: 6,
    marginBottom: 28
  },
  input: {
    paddingHorizontal: 18,
    height: 58,
    width: '82%',
    fontSize: 16,
    color: '#0A0F2E'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  btn: {
    height: 56,
    borderRadius: 18,
    marginTop: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 8,
  },
  forgot: {
    alignSelf: 'flex-end',
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  link: {
    textAlign: 'center',
    color: '#8B92B8',
    marginTop: 20,
    fontSize: 14
  },
  linkBold: {
    color: '#004AC6',
    fontWeight: '700'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  orText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  signupText: {
    color: '#6B7280',
    fontSize: 15,
  },

  signupButton: {
    marginLeft: 6,
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
});