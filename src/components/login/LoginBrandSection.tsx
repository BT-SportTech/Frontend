import loginSection from '../../assets/Login_section.png'

export function LoginBrandSection() {
  return (
    <section className="relative flex min-h-[40vh] flex-1 flex-col justify-start overflow-hidden px-8 py-10 lg:min-h-full lg:px-14 lg:py-16">
      <img
        src={loginSection}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-transparent to-transparent" />
      <div className="relative z-10 animate-fade-in">
        <p className="font-display text-5xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
          SportTech
        </p>
        <p className="mt-3 max-w-sm text-lg font-medium text-accent">
          Admin console
        </p>
      </div>
    </section>
  )
}
