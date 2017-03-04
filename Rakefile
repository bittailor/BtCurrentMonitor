task :serve do 
    Dir.chdir('web-ui') do
        sh "browser-sync start --server --files ./**/*.*"
    end
end

namespace :firmware do 
    
    directory 'firmware/bin'

    task :compile => 'firmware/bin' do 
        Dir.chdir('firmware') do
            sh "particle compile photon . --saveTo bin/firmware.bin"
        end
    end

    task :flash do 
        Dir.chdir('firmware') do
            sh "particle flash bt-photon-1"
        end
    end

end


task :default => 'firmware:compile'
