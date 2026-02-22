import { ElMessageBox } from 'element-plus'

const Confirm = ({
  message,
  okfun,
  showCancelBtn = true,
  showClose = true,
  okText = '确定',
  cancelText = '取消',
  cancelfun
}) => {
  ElMessageBox.confirm(message, '提示', {
    'close-on-click-modal': false,
    confirmButtonText: okText,
    cancelButtonText: cancelText,
    showCancelButton: showCancelBtn,
    showClose: showClose,
    type: 'info'
  })
    .then(async () => {
      if (okfun) {
        okfun()
      }
    })
    .catch((action) => {
      if (action === 'cancel' && cancelfun) {
        cancelfun()
      }
    })
}

const Alert = (msg, okfun) => {
  ElMessageBox.alert(msg, '确认', {
    confirmButtonText: 'OK',
    showClose: false,
    callback: (action) => {
      if (action === 'confirm' && okfun) {
        okfun()
      }
    }
  })
}
export { Confirm, Alert }
