/**
 * 图片显示组件
 * 
 * 功能说明:
 * - 用于显示任务中的附件图片
 * - 处理本地文件路径的转换
 * - 通过 Electron API 获取图片的绝对路径
 * - 支持 file:// 协议的路径处理
 * - 自动将相对路径转换为可访问的绝对路径
 * 
 * 使用场景:
 * - 在任务卡片中显示附件图片
 * - 在图片预览模态框中显示大图
 * - 所有需要显示本地图片的地方
 */
import { useEffect, useState } from 'react'
export default function TaskImage({ src, alt, className, style, ...props }) {
  const [imageSrc, setImageSrc] = useState('')

  useEffect(() => {
    if (!src) return

    if (src.startsWith('blob:')) {
      setImageSrc(src)
      return
    }

    if (src.startsWith('file://')) {
      const cleanPath = src.replace('file://', '')
      window.electron?.image?.getPath(cleanPath).then(absPath => {
        setImageSrc(`file:///${absPath.replace(/\\/g, '/')}`)
      })
    } else {
      window.electron?.image?.getPath(src).then(absPath => {
        setImageSrc(`file:///${absPath.replace(/\\/g, '/')}`)
      })
    }
  }, [src])

  if (!imageSrc) return null

  return <img src={imageSrc} alt={alt} className={className} style={style} {...props} />
}
